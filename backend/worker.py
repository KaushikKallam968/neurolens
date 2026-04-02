"""
Standalone analysis worker — runs in a separate process.

Spawned by main.py for each video analysis. Loads TribeV2, runs inference,
saves results to SQLite, then exits. Clean process lifecycle = no zombies.

Usage: python -m backend.worker <analysis_id> <video_path>
"""

import sys
import time
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def run_analysis(analysis_id, video_path):
    """Load model, run inference, save results, exit."""
    from .inference import TribeInference
    from .db import init_db, save_analysis

    init_db()

    def on_stage(stage, partial_data=None):
        save_analysis(
            analysis_id=analysis_id,
            status="processing",
            stage=stage,
            data=partial_data,
        )
        logger.info(f"Analysis {analysis_id}: stage={stage}")

    try:
        logger.info(f"Worker starting for {analysis_id}")

        engine = TribeInference()
        engine.load_model()

        result = engine.analyze(video_path, on_stage=on_stage)

        save_analysis(
            analysis_id=analysis_id,
            status="complete",
            stage="complete",
            data=result,
            completed_at=time.time(),
        )
        logger.info(f"Worker complete for {analysis_id}")

    except Exception as e:
        logger.error(f"Worker failed for {analysis_id}: {e}")
        save_analysis(
            analysis_id=analysis_id,
            status="error",
            error=str(e),
        )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m backend.worker <analysis_id> <video_path>")
        sys.exit(1)

    run_analysis(sys.argv[1], sys.argv[2])
