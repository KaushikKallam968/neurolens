"""
NeuroLens API — FastAPI backend for brain-powered video analytics.

Endpoints:
  POST /api/analyze        Upload video, start async analysis
  GET  /api/results/{id}   Fetch analysis results by ID
  GET  /api/health         Health check
"""

import os
import sys
import uuid
import time
import logging
import subprocess
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .inference import TribeInference
from .db import init_db, save_analysis, get_analysis, list_analyses as db_list_analyses

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

# CORS — allow all origins for tunnel access (Vercel -> ngrok/Cloudflare Tunnel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# SQLite database (replaces in-memory results_store)

# Inference engine — only used for health checks (model not loaded in server process)
engine = TribeInference()

# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    logger.info("Starting NeuroLens API...")
    init_db()
    # Don't load model in server process — worker processes load their own
    # This keeps the server lightweight and avoids CUDA zombie issues
    logger.info("Server ready (workers load model on demand)")


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

    # Persist initial processing state to SQLite
    save_analysis(
        analysis_id=analysis_id,
        status="processing",
        filename=file.filename,
        video_path=str(file_path),
        created_at=time.time(),
    )

    # Spawn analysis in a separate process — clean lifecycle, no CUDA zombies
    worker_cmd = [
        sys.executable, "-m", "backend.worker",
        analysis_id, str(file_path),
    ]
    # Run from the project root so module imports work
    project_root = str(Path(__file__).parent.parent)
    env = {**os.environ, "NEUROLENS_MOCK": os.getenv("NEUROLENS_MOCK", "false")}
    subprocess.Popen(
        worker_cmd,
        cwd=project_root,
        env=env,
        # Detach from server process so it doesn't block shutdown
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0,
    )
    logger.info(f"Spawned worker process for {analysis_id}")

    return {
        "analysisId": analysis_id,
        "status": "processing",
    }


@app.get("/api/results/{analysis_id}")
async def get_results(analysis_id: str):
    """
    Fetch analysis results by ID.

    Returns:
        {"analysisId": str, "status": str, "data": dict|null, "error": str|null}
    """
    entry = get_analysis(analysis_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return {
        "analysisId": analysis_id,
        "status": entry["status"],
        "data": entry.get("data"),
        "error": entry.get("error"),
        "filename": entry.get("filename"),
        "stage": entry.get("stage"),
    }


@app.get("/api/video/{analysis_id}")
async def get_video(analysis_id: str):
    """
    Serve the uploaded video file for playback.
    """
    entry = get_analysis(analysis_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Analysis not found")

    video_path = entry.get("video_path")

    if not video_path or not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=entry.get("filename", "video.mp4"),
    )


@app.get("/api/analyses")
async def list_analyses():
    """
    Return a list of all completed analyses with summary info.
    """
    rows = db_list_analyses()
    analyses = []
    for entry in rows:
        neural_score = None
        if entry.get("data") and entry["data"].get("neuralScore") is not None:
            neural_score = entry["data"]["neuralScore"]

        analyses.append({
            "analysisId": entry["analysis_id"],
            "filename": entry.get("filename"),
            "neuralScore": neural_score,
            "createdAt": entry.get("created_at"),
            "completedAt": entry.get("completed_at"),
        })

    return analyses


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "engine": "worker-pool",
        "mock": engine.is_mock,
        "version": "0.2.0",
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
