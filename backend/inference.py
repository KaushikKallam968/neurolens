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

from .metrics import compute_metrics
from .mock_inference import generate_mock_results

# Fix for loading Linux-created checkpoints on Windows
if sys.platform == "win32":
    pathlib.PosixPath = pathlib.WindowsPath

logger = logging.getLogger(__name__)


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
            cache_dir = os.path.join(os.path.dirname(__file__), "cache")
            os.makedirs(cache_dir, exist_ok=True)
            # Use posix-style separator for HuggingFace repo ID
            self.model = TribeModel.from_pretrained(
                "facebook" + "/" + "tribev2",
                cache_folder=cache_dir,
            )
            logger.info("TribeV2 model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load TribeV2 model: {e}")
            logger.warning("Falling back to mock mode")
            self.mock_mode = True
            self.model = None

    def analyze(self, video_path):
        """
        Run brain activity prediction on a video file.

        Args:
            video_path: path to the uploaded video file

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

        return self._run_real_inference(video_path)

    def _run_real_inference(self, video_path):
        """Run actual TribeV2 inference pipeline."""
        try:
            logger.info(f"Running TribeV2 inference on: {video_path}")

            # Extract video events
            df = self.model.get_events_dataframe(video_path=video_path)

            if df is None or len(df) == 0:
                raise RuntimeError("TribeV2 produced no events from video")

            # Run cortical prediction
            preds, segments = self.model.predict(events=df)

            if preds is None:
                raise RuntimeError("TribeV2 prediction returned None")

            logger.info(
                f"Inference complete: {preds.shape[0]} timesteps, "
                f"{preds.shape[1]} vertices"
            )

            return compute_metrics(preds, segments)

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
