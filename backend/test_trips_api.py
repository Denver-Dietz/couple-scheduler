import pytest
from fastapi.testclient import TestClient
import sqlite3
import tempfile
import os
import json

from backend.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    """Setup and teardown the database for each test."""
    db_fd, db_path = tempfile.mkstemp()

    # We need to initialize the schema. Let's patch the DB_PATH in database.py temporarily to run init_db
    import backend.database as db
    original_db_path = db.DB_PATH
    db.DB_PATH = db_path
    db.init_db()

    yield db_path

    db.DB_PATH = original_db_path
    os.close(db_fd)
    os.unlink(db_path)


def test_get_trip_not_found():
    response = client.get("/api/trips/nonexistent-id")
    assert response.status_code == 404
    assert response.json() == {"detail": "Trip not found"}


def test_get_trip_success(setup_database):
    db_path = setup_database
    # Insert a dummy trip into the database
    conn = sqlite3.connect(db_path, timeout=10)
    cursor = conn.cursor()
    trip_id = "test-trip-123"
    cursor.execute(
        """
        INSERT INTO trips (id, name, dates, destination, cover_photo, mood_tags, progress)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (trip_id, "Test Trip", "2024-01-01 to 2024-01-10", "Test Dest", None, json.dumps(["fun"]), 0)
    )
    # Insert some related data to test the fetch_trip_data relations
    cursor.execute(
        """
        INSERT INTO trip_itinerary (id, trip_id, day, title, time, location, notes, partner_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("itinerary-1", trip_id, "1", "Arrival", "10:00", "Airport", None, None)
    )
    conn.commit()
    conn.close()

    response = client.get(f"/api/trips/{trip_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == trip_id
    assert data["name"] == "Test Trip"
    assert "itinerary" in data
    assert len(data["itinerary"]) == 1
    assert data["itinerary"][0]["title"] == "Arrival"
    assert "wishlist" in data
    assert len(data["wishlist"]) == 0
