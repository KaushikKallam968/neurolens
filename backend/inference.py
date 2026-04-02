"""
TribeV2 inference pipeline with automatic mock fallback.

In production, loads Meta's TribeV2 model and runs real cortical
predictions on uploaded video. In dev/demo mode (NEUROLENS_MOCK=true),
returns convincing mock data without requiring TribeV2 or GPU.
"""

import os
import sys
import logging
import pathlib
import torch

from .metrics import compute_metrics
from .mock_inference import generate_mock_results

# Fix for loading Linux-created checkpoints on Windows
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath

# Patch torch.load for PyTorch 2.6+ compatibility with pyannote/whisperx
# Must be done before any library imports torch.load
_original_torch_load = torch.load

def _patched_torch_load(*args, **kwargs):
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return _original_torch_load(*args, **kwargs)

torch.load = _patched_torch_load

logger = logging.getLogger(__name__)

# Use very short cache path on Windows to avoid 260-char path limit
# (neuralset/exca creates deeply nested subdirectory names)
CACHE_DIR = os.path.join("C:\\", "nlc") if sys.platform == "win32" else os.path.join(os.path.dirname(__file__), "cache")


def _tribev2_available():
    """Check if TribeV2 is installed and importable."""
    try:
        import tribev2  # noqa: F401
        return True
    except ImportError:
        return False


class TribeInference:
    def __init__(self):
        self.model = None
        env_mock = os.getenv("NEUROLENS_MOCK", "true").lower()
        self.mock_mode = env_mock == "true"

        # Force mock mode if TribeV2 isn't installed
        if not self.mock_mode and not _tribev2_available():
            logger.warning(
                "TribeV2 not installed — falling back to mock mode. "
                "Install tribev2 and set NEUROLENS_MOCK=false for real inference."
            )
            self.mock_mode = True

    def load_model(self):
        """
        Load the TribeV2 model. No-op in mock mode.
        Call this once at startup, not per-request.
        """
        if self.mock_mode:
            logger.info("Running in mock mode — no model to load")
            return

        try:
            from tribev2 import TribeModel

            logger.info("Loading TribeV2 model (this may download ~10GB on first run)...")
            os.makedirs(CACHE_DIR, exist_ok=True)

            # Set environment variable so neuralset/exca also use short path
            os.environ["EXCA_CACHE_DIR"] = CACHE_DIR

            self.model = TribeModel.from_pretrained(
                "facebook" + "/" + "tribev2",
                cache_folder=CACHE_DIR,
            )

            # Force num_workers=0 on Windows to prevent DataLoader
            # multiprocessing deadlocks (19+ zombie worker processes)
            if sys.platform == "win32":
                self.model.data.num_workers = 0
                logger.info("Set num_workers=0 for Windows compatibility")

            logger.info("TribeV2 model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load TribeV2 model: {e}")
            logger.warning("Falling back to mock mode")
            self.mock_mode = True
            self.model = None

    def analyze(self, video_path, on_stage=None):
        """
        Run brain activity prediction on a video file.

        Args:
            video_path: path to the uploaded video file
            on_stage: optional callback(stage_name, partial_data) for progressive updates

        Returns:
            dict with neuralScore, timeline, peaks, suggestions

        Raises:
            FileNotFoundError: if video_path doesn't exist
            RuntimeError: if inference fails and can't recover
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        if self.mock_mode:
            logger.info(f"Mock analysis for: {video_path}")
            return generate_mock_results(video_path)

        return self._run_real_inference(video_path, on_stage)

    def _run_real_inference(self, video_path, on_stage=None):
        """Run actual TribeV2 inference pipeline with progressive stage updates."""
        _report = on_stage or (lambda stage, data=None: None)

        try:
            logger.info(f"Running TribeV2 inference on: {video_path}")

            # Stage 1: Extract events (audio extraction + whisperx transcription)
            _report("extracting_events")
            try:
                df = self.model.get_events_dataframe(video_path=video_path)
            except Exception as e:
                logger.warning(f"Event extraction failed, trying audio-only mode: {e}")
                try:
                    from tribev2.demo_utils import get_audio_and_text_events
                    import pandas as pd
                    event = {
                        "type": "Video",
                        "filepath": str(video_path),
                        "start": 0,
                        "timeline": "default",
                        "subject": "default",
                    }
                    df = get_audio_and_text_events(
                        pd.DataFrame([event]), audio_only=True
                    )
                except Exception as e2:
                    raise RuntimeError(
                        f"Event extraction failed even in audio-only mode: {e2}"
                    ) from e2

            if df is None or len(df) == 0:
                raise RuntimeError("TribeV2 produced no events from video")

            # Report event extraction info
            n_words = len(df[df.type == "Word"]) if "type" in df.columns else 0
            _report("events_extracted", {
                "hasTranscript": n_words > 0,
                "wordCount": n_words,
            })

            # Stage 2: Extract features (V-JEPA2 + Wav2Vec-BERT)
            _report("extracting_features")

            # Stage 3: Run brain prediction model
            _report("predicting")
            preds, segments = self.model.predict(events=df)

            if preds is None:
                raise RuntimeError("TribeV2 prediction returned None")

            logger.info(
                f"Inference complete: {preds.shape[0]} timesteps, "
                f"{preds.shape[1]} vertices"
            )

            # Stage 4: Compute metrics (fast — sub-second)
            _report("computing_metrics")
            result = compute_metrics(preds, segments)

            return result

        except Exception as e:
            logger.error(f"TribeV2 inference failed: {e}")
            raise RuntimeError(f"Analysis failed: {str(e)}") from e

    @property
    def is_mock(self):
        """Whether the engine is running in mock mode."""
        return self.mock_mode

    @property
    def status(self):
        """Current engine status for health checks."""
        if self.mock_mode:
            return "mock"
        if self.model is not None:
            return "ready"
        return "not_loaded"
