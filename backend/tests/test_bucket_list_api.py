import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db, init_db
import tempfile
import os

client = TestClient(app)

@pytest.fixture(autouse=True)
def test_db():
    # Use a temporary file for the database to avoid polluting scheduler.db
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        tmp_db_path = tmp.name

    # Monkeypatch the DB_PATH in database module
    import backend.database as database
    original_db_path = database.DB_PATH
    database.DB_PATH = tmp_db_path

    # Initialize the database schema
    init_db()

    yield

    # Cleanup
    database.DB_PATH = original_db_path
    if os.path.exists(tmp_db_path):
        os.remove(tmp_db_path)

def test_create_bucket_list_item():
    payload = {
        "item_type": "travel",
        "title": "Visit Paris",
        "estimated_cost": "$$$",
        "effort_level": "medium",
        "latitude": 48.8566,
        "longitude": 2.3522,
        "address": "Paris, France",
        "cover_image_url": "http://example.com/paris.jpg"
    }

    response = client.post("/api/bucket-list", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "id" in data

    # Verify in DB
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bucket_list_items WHERE id = ?", (data["id"],))
        item = cursor.fetchone()

        assert item is not None
        assert item["title"] == "Visit Paris"
        assert item["item_type"] == "travel"
        assert item["estimated_cost"] == "$$$"
        assert item["effort_level"] == "medium"
        assert item["latitude"] == 48.8566
        assert item["longitude"] == 2.3522
        assert item["address"] == "Paris, France"
        assert item["cover_image_url"] == "http://example.com/paris.jpg"
        assert item["couple_id"] == "default"


def test_create_bucket_list_item_minimal():
    payload = {
        "item_type": "experience",
        "title": "Learn to surf"
    }

    response = client.post("/api/bucket-list", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "id" in data

    # Verify in DB
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bucket_list_items WHERE id = ?", (data["id"],))
        item = cursor.fetchone()

        assert item is not None
        assert item["title"] == "Learn to surf"
        assert item["item_type"] == "experience"
        assert item["estimated_cost"] is None
        assert item["effort_level"] is None
        assert item["latitude"] is None
        assert item["longitude"] is None
        assert item["address"] is None
        assert item["cover_image_url"] is None
        assert item["couple_id"] == "default"

def test_create_bucket_list_item_invalid_payload():
    # Missing required field "title"
    payload = {
        "item_type": "experience"
    }

    response = client.post("/api/bucket-list", json=payload)
    assert response.status_code == 422 # Unprocessable Entity

def test_create_bucket_list_item_missing_item_type():
    # Missing required field "item_type"
    payload = {
        "title": "Visit Paris"
    }

    response = client.post("/api/bucket-list", json=payload)
    assert response.status_code == 422 # Unprocessable Entity
