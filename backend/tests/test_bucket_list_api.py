import pytest
import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db, init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()

    with get_db() as conn:
        cursor = conn.cursor()

        # Ensure the test database is clean before running tests
        cursor.execute("DELETE FROM bucket_list_items")
        cursor.execute("DELETE FROM bucket_list_links")
        cursor.execute("DELETE FROM trips")
        cursor.execute("DELETE FROM trip_resources")
        conn.commit()

def test_promote_to_trip_success():
    item_id = str(uuid.uuid4())
    link_id_1 = str(uuid.uuid4())
    link_id_2 = str(uuid.uuid4())

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO bucket_list_items
            (id, couple_id, item_type, title, estimated_cost, effort_level, status)
            VALUES (?, 'default', 'destination', 'Test Destination', 'medium', 'medium', 'idea')
        ''', (item_id,))

        cursor.execute('''
            INSERT INTO bucket_list_links (id, bucket_list_item_id, url)
            VALUES (?, ?, ?)
        ''', (link_id_1, item_id, 'http://example.com/1'))

        cursor.execute('''
            INSERT INTO bucket_list_links (id, bucket_list_item_id, url)
            VALUES (?, ?, ?)
        ''', (link_id_2, item_id, 'http://example.com/2'))
        conn.commit()

    response = client.post(f"/api/bucket-list/promote/{item_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "trip_id" in data
    trip_id = data["trip_id"]

    with get_db() as conn:
        cursor = conn.cursor()

        # Verify item status updated
        cursor.execute("SELECT status FROM bucket_list_items WHERE id = ?", (item_id,))
        item = cursor.fetchone()
        assert item["status"] == "promoted"

        # Verify trip created
        cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
        trip = cursor.fetchone()
        assert trip is not None
        assert trip["name"] == "Test Destination"
        assert trip["destination"] == "Test Destination"

        # Verify links copied to trip resources
        cursor.execute("SELECT * FROM trip_resources WHERE trip_id = ?", (trip_id,))
        resources = cursor.fetchall()
        assert len(resources) == 2
        urls = sorted([r["content_url"] for r in resources])
        assert urls == ['http://example.com/1', 'http://example.com/2']
        assert all(r["resource_type"] == "research_link" for r in resources)

def test_promote_to_trip_not_found():
    response = client.post(f"/api/bucket-list/promote/nonexistent_id")
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"
