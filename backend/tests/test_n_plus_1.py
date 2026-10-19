import pytest
import tempfile
import os
from unittest.mock import patch
from fastapi.testclient import TestClient

import backend.database

@pytest.fixture(autouse=True)
def mock_db_path():
    fd, path = tempfile.mkstemp()
    with patch("backend.database.DB_PATH", path):
        backend.database.init_db()
        yield path
    os.close(fd)
    os.unlink(path)

@pytest.fixture
def test_client(mock_db_path):
    from backend.main import app, get_db

    # Insert test data
    with get_db() as conn:
        # Journal Entries
        conn.execute("INSERT INTO journal_entries (id, user_id, content) VALUES ('e1', 'user1', 'entry 1')")
        conn.execute("INSERT INTO journal_comments (id, entry_id, user_id, content) VALUES ('c1', 'e1', 'user2', 'comment 1')")
        conn.execute("INSERT INTO journal_reactions (id, entry_id, user_id, reaction) VALUES ('r1', 'e1', 'user2', '👍')")

        # Memories
        conn.execute("INSERT INTO memories (id, couple_id, caption) VALUES ('m1', 'default', 'desc 1')")
        conn.execute("INSERT INTO memory_comments (id, memory_id, user_id, comment_text) VALUES ('mc1', 'm1', 'user1', 'mcomment 1')")
        conn.execute("INSERT INTO memory_reactions (id, memory_id, user_id, reaction_type) VALUES ('mr1', 'm1', 'user1', '❤️')")

        conn.commit()

    client = TestClient(app)
    return client

def test_get_journal_entries(test_client):
    response = test_client.get("/api/journal")
    assert response.status_code == 200
    entries = response.json()
    assert len(entries) == 1
    assert entries[0]["id"] == "e1"
    assert len(entries[0]["comments"]) == 1
    assert entries[0]["comments"][0]["id"] == "c1"
    assert len(entries[0]["reactions"]) == 1
    assert entries[0]["reactions"][0]["id"] == "r1"

def test_get_memories(test_client):
    response = test_client.get("/api/memories")
    assert response.status_code == 200
    memories = response.json()
    assert len(memories) == 1
    assert memories[0]["id"] == "m1"
    assert len(memories[0]["comments"]) == 1
    assert memories[0]["comments"][0]["id"] == "mc1"
    assert len(memories[0]["reactions"]) == 1
    assert memories[0]["reactions"][0]["id"] == "mr1"
