import pytest
import sqlite3
import uuid
from datetime import datetime
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from contextlib import contextmanager

from backend.main import app

client = TestClient(app)

@pytest.fixture
def db_conn():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS check_ins (
        id TEXT PRIMARY KEY,
        couple_id TEXT,
        month_year TEXT,
        status TEXT DEFAULT 'pending'
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS check_in_responses (
        id TEXT PRIMARY KEY,
        checkin_id TEXT,
        user_id TEXT,
        communication_score INTEGER,
        intimacy_score INTEGER,
        quality_time_score INTEGER,
        teamwork_score INTEGER,
        notes TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (checkin_id) REFERENCES check_ins(id)
    )
    ''')

    conn.commit()
    yield conn
    conn.close()

@patch('backend.main.notify_frontend')
@patch('backend.main.get_db')
def test_submit_checkin_completion_check(mock_get_db, mock_notify, db_conn):
    @contextmanager
    def mock_db_context():
        yield db_conn

    mock_get_db.side_effect = mock_db_context

    now = datetime.now()
    month_year = f"{now.year}-{now.month:02d}"
    couple_id = "default"
    checkin_id = str(uuid.uuid4())

    cursor = db_conn.cursor()
    cursor.execute(
        "INSERT INTO check_ins (id, couple_id, month_year, status) VALUES (?, ?, ?, ?)",
        (checkin_id, couple_id, month_year, 'pending')
    )

    resp_id_1 = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO check_in_responses
        (id, checkin_id, user_id, communication_score, intimacy_score, quality_time_score, teamwork_score, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (resp_id_1, checkin_id, "user1", 5, 5, 5, 5, "Good"))
    db_conn.commit()

    payload = {
        "communication_score": 4,
        "intimacy_score": 4,
        "quality_time_score": 4,
        "teamwork_score": 4,
        "notes": "Nice"
    }

    response = client.post("/api/checkins/submit?user_id=user2", json=payload)

    assert response.status_code == 200
    assert response.json() == {"success": True}

    cursor.execute("SELECT status FROM check_ins WHERE id = ?", (checkin_id,))
    checkin_record = cursor.fetchone()
    assert checkin_record['status'] == 'completed'
