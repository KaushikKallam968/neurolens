"""
Replicate Cog predictor for NeuroLens brain analytics.

Pipeline: load video -> extract events (audio + transcript) -> predict cortical
activity (20,484 vertices) -> compute marketing metrics -> apply content preset
weights -> extract thumbnails -> return full JSON.
"""

import os
import sys
import json
import logging
import tempfile
import subprocess
import pathlib
from typing import Optional

import torch
import numpy as np

# Cog predictor framework
from cog import BasePredictor, Input, Path

# Add parent dir to path so 'from tribev2.model import ...' works
sys.path.insert(0, os.path.dirname(__file__))

from metrics import compute_metrics
from content_presets import apply_preset

logger = logging.getLogger(__name__)


class Predictor(BasePredictor):
    """TribeV2 brain prediction + NeuroLens metrics pipeline."""

    def setup(self):
        """Load TribeV2 model into GPU memory. Called once when container starts."""
        logger.info("Loading TribeV2 model...")

        from tribev2.demo_utils import TribeModel

        # Load model from HuggingFace Hub
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = TribeModel.from_pretrained(
            "facebook/tribev2",
            device=device,
            cache_folder="/tmp/tribev2_cache",
        )

        if torch.cuda.is_available():
            logger.info(f"Model loaded on GPU: {torch.cuda.get_device_name(0)}")
        else:
            logger.warning("No GPU detected — inference will be slow")

        logger.info("TribeV2 model ready")

    def predict(
        self,
        video: Path = Input(description="Video file to analyze"),
        content_type: str = Input(
            description="Content type preset for metric weighting",
            choices=["short-form", "ad", "youtube", "podcast-clip", "custom"],
            default="custom",
        ),
        extract_thumbnails: bool = Input(
            description="Extract key moment thumbnails via ffmpeg",
            default=True,
        ),
    ) -> str:
        """
        Run brain prediction on a video and return full analysis JSON.

        Returns a JSON string with neuralScore, metrics, timeline, peaks,
        suggestions, and optionally thumbnail paths.
        """
        video_path = str(video)
        logger.info(f"Analyzing: {video_path} (content_type={content_type})")

        # Stage 1: Extract events (audio, transcript, visual features)
        logger.info("Stage: extracting_events")
        events = self.model.get_events_dataframe(video_path=video_path)
        logger.info(f"Events extracted: {len(events)} rows")

        # Stage 2: Predict cortical activity
        logger.info("Stage: predicting")
        with torch.no_grad():
            predictions, segments = self.model.predict(events)

        # predictions shape: (n_timesteps, 20484) — fsaverage5 cortical mesh
        if isinstance(predictions, torch.Tensor):
            predictions = predictions.cpu().numpy()

        logger.info(f"Predictions shape: {predictions.shape}")

        # Stage 3: Compute marketing metrics
        logger.info("Stage: computing_metrics")
        result = compute_metrics(predictions, segments)

        # Stage 4: Apply content type preset weights
        result = apply_preset(result, content_type)

        # Stage 5: Extract thumbnails at key moments
        if extract_thumbnails and result.get("keyMoments"):
            thumbnails = self._extract_thumbnails(video_path, result["keyMoments"])
            result["thumbnails"] = thumbnails

        # Compute video metadata
        result["videoMeta"] = self._get_video_meta(video_path)

        # Clean up GPU memory
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info(f"Analysis complete. Neural score: {result.get('neuralScore', 'N/A')}")
        return json.dumps(result)

    def _extract_thumbnails(self, video_path, key_moments, max_thumbnails=5):
        """Extract video frames at key moment timestamps via ffmpeg."""
        thumbnails = []
        output_dir = tempfile.mkdtemp(prefix="neurolens_thumbs_")

        for i, moment in enumerate(key_moments[:max_thumbnails]):
            timestamp = moment.get("timestamp", 0)
            output_path = os.path.join(output_dir, f"thumb_{i}_{timestamp}s.jpg")
            try:
                subprocess.run(
                    [
                        "ffmpeg", "-y",
                        "-ss", str(timestamp),
                        "-i", video_path,
                        "-vframes", "1",
                        "-q:v", "2",
                        "-vf", "scale=640:-1",
                        output_path,
                    ],
                    capture_output=True,
                    timeout=10,
                )
                if os.path.exists(output_path):
                    thumbnails.append({
                        "timestamp": timestamp,
                        "path": output_path,
                        "label": moment.get("label", f"Moment {i+1}"),
                    })
            except (subprocess.TimeoutExpired, FileNotFoundError):
                logger.warning(f"Failed to extract thumbnail at t={timestamp}")

        return thumbnails

    def _get_video_meta(self, video_path):
        """Extract basic video metadata via ffprobe."""
        try:
            result = subprocess.run(
                [
                    "ffprobe", "-v", "quiet",
                    "-print_format", "json",
                    "-show_format", "-show_streams",
                    video_path,
                ],
                capture_output=True, text=True, timeout=10,
            )
            probe = json.loads(result.stdout)
            fmt = probe.get("format", {})
            video_stream = next(
                (s for s in probe.get("streams", []) if s.get("codec_type") == "video"),
                {}
            )
            return {
                "duration": float(fmt.get("duration", 0)),
                "size": int(fmt.get("size", 0)),
                "width": int(video_stream.get("width", 0)),
                "height": int(video_stream.get("height", 0)),
                "fps": eval(video_stream.get("r_frame_rate", "0/1")) if video_stream.get("r_frame_rate") else 0,
                "codec": video_stream.get("codec_name", "unknown"),
            }
        except Exception as e:
            logger.warning(f"Failed to extract video metadata: {e}")
            return {"duration": 0, "size": 0}
