"""
SQLite persistence for analysis results.
Database file: backend/neurolens.db
"""

import sqlite3
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent / "neurolens.db"


def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    """Create tables if they don't exist."""
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            analysis_id TEXT PRIMARY KEY,
            status TEXT NOT NULL DEFAULT 'processing',
            filename TEXT,
            video_path TEXT,
            data TEXT,
            error TEXT,
            created_at REAL,
            completed_at REAL
        )
    """)
    conn.commit()
    conn.close()
    logger.info(f"Database initialized at {DB_PATH}")


def save_analysis(analysis_id, status, filename=None, video_path=None, data=None, error=None, created_at=None, completed_at=None):
    """Insert or update an analysis record."""
    conn = get_connection()
    conn.execute("""
        INSERT INTO analyses (analysis_id, status, filename, video_path, data, error, created_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(analysis_id) DO UPDATE SET
            status=excluded.status,
            data=excluded.data,
            error=excluded.error,
            completed_at=excluded.completed_at
    """, (
        analysis_id,
        status,
        filename,
        video_path,
        json.dumps(data) if data else None,
        error,
        created_at,
        completed_at,
    ))
    conn.commit()
    conn.close()


def get_analysis(analysis_id):
    """Get a single analysis by ID. Returns dict or None."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM analyses WHERE analysis_id = ?", (analysis_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return _row_to_dict(row)


def list_analyses():
    """Get all completed analyses, newest first."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM analyses WHERE status = 'complete' ORDER BY completed_at DESC"
    ).fetchall()
    conn.close()
    return [_row_to_dict(r) for r in rows]


def _row_to_dict(row):
    d = dict(row)
    if d.get("data"):
        try:
            d["data"] = json.loads(d["data"])
        except (json.JSONDecodeError, TypeError):
            d["data"] = None
    return d
