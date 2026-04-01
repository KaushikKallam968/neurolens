"""
NeuroLens API — FastAPI backend for brain-powered video analytics.

Endpoints:
  POST /api/analyze        Upload video, start async analysis
  GET  /api/results/{id}   Fetch analysis results by ID
  GET  /api/health         Health check
"""

import os
import uuid
import time
import logging
import asyncio
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .inference import TribeInference

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NeuroLens API",
    version="0.1.0",
    description="Brain analytics for video content using TribeV2",
)

# CORS — allow Vite dev server and common local dev origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory results store (no database for MVP)
results_store = {}

# Inference engine (singleton)
engine = TribeInference()

# Thread pool for running analysis without blocking the event loop
executor = ThreadPoolExecutor(max_workers=2)

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    logger.info("Starting NeuroLens API...")
    engine.load_model()
    logger.info(f"Inference engine status: {engine.status}")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/analyze")
async def analyze_video(file: UploadFile = File(...)):
    """
    Accept a video file upload, save it, and start async analysis.

    Returns:
        {"analysisId": str, "status": "processing"}
    """
    # Validate file type
    allowed_types = {
        "video/mp4", "video/quicktime", "video/x-msvideo",
        "video/webm", "video/mpeg", "application/octet-stream",
    }
    content_type = file.content_type or "application/octet-stream"
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Upload a video file.",
        )

    analysis_id = str(uuid.uuid4())

    # Save uploaded file
    try:
        ext = Path(file.filename or "video.mp4").suffix or ".mp4"
        file_path = UPLOAD_DIR / f"{analysis_id}{ext}"

        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        logger.info(f"Saved upload: {file_path} ({len(contents)} bytes)")
    except Exception as e:
        logger.error(f"Failed to save upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to save video file")

    # Initialize result entry
    results_store[analysis_id] = {
        "status": "processing",
        "data": None,
        "error": None,
        "createdAt": time.time(),
        "filename": file.filename,
    }

    # Run analysis in background thread
    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, _run_analysis, analysis_id, str(file_path))

    return {
        "analysisId": analysis_id,
        "status": "processing",
    }


def _run_analysis(analysis_id, video_path):
    """Run inference in a background thread. Updates results_store in place."""
    try:
        logger.info(f"Starting analysis: {analysis_id}")
        result = engine.analyze(video_path)

        results_store[analysis_id]["status"] = "complete"
        results_store[analysis_id]["data"] = result
        results_store[analysis_id]["completedAt"] = time.time()
        logger.info(f"Analysis complete: {analysis_id}")

    except Exception as e:
        logger.error(f"Analysis failed for {analysis_id}: {e}")
        results_store[analysis_id]["status"] = "error"
        results_store[analysis_id]["error"] = str(e)

    finally:
        # Clean up uploaded file after analysis
        try:
            if os.path.exists(video_path):
                os.remove(video_path)
                logger.info(f"Cleaned up: {video_path}")
        except OSError as e:
            logger.warning(f"Failed to clean up {video_path}: {e}")


@app.get("/api/results/{analysis_id}")
async def get_results(analysis_id: str):
    """
    Fetch analysis results by ID.

    Returns:
        {"analysisId": str, "status": str, "data": dict|null, "error": str|null}
    """
    if analysis_id not in results_store:
        raise HTTPException(status_code=404, detail="Analysis not found")

    entry = results_store[analysis_id]

    return {
        "analysisId": analysis_id,
        "status": entry["status"],
        "data": entry["data"],
        "error": entry["error"],
        "filename": entry.get("filename"),
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "engine": engine.status,
        "mock": engine.is_mock,
        "version": "0.1.0",
    }


# ---------------------------------------------------------------------------
# Static file serving (production mode — serves built frontend)
# ---------------------------------------------------------------------------

FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_DIR.is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        """Serve the React SPA for all non-API routes."""
        file_path = FRONTEND_DIR / path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIR / "index.html"))
