import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bucket_list_links")
        cursor.execute("DELETE FROM bucket_list_items")
        conn.commit()
    yield
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bucket_list_links")
        cursor.execute("DELETE FROM bucket_list_items")
        conn.commit()

def test_get_bucket_list_empty():
    response = client.get("/api/bucket-list")
    assert response.status_code == 200
    assert response.json() == []

def test_get_bucket_list_with_items_and_links():
    # 1. Create item A (with 2 links)
    item_a_payload = {
        "item_type": "destination",
        "title": "Tokyo",
        "estimated_cost": "$2000",
        "effort_level": "high"
    }
    resp_a = client.post("/api/bucket-list", json=item_a_payload)
    assert resp_a.status_code == 200
    item_a_id = resp_a.json()["id"]

    link_a1_payload = {"url": "https://example.com/tokyo1"}
    client.post(f"/api/bucket-list/{item_a_id}/links", json=link_a1_payload)
    link_a2_payload = {"url": "https://example.com/tokyo2"}
    client.post(f"/api/bucket-list/{item_a_id}/links", json=link_a2_payload)

    # 2. Create item B (with no links)
    item_b_payload = {
        "item_type": "experience",
        "title": "Skydiving",
        "estimated_cost": "$300",
        "effort_level": "medium"
    }
    resp_b = client.post("/api/bucket-list", json=item_b_payload)
    assert resp_b.status_code == 200
    item_b_id = resp_b.json()["id"]

    # 3. Fetch bucket list
    response = client.get("/api/bucket-list")
    assert response.status_code == 200
    items = response.json()

    # Assertions
    assert len(items) == 2

    fetched_item_a = next(item for item in items if item["id"] == item_a_id)
    fetched_item_b = next(item for item in items if item["id"] == item_b_id)

    # Verify item A
    assert fetched_item_a["title"] == "Tokyo"
    assert len(fetched_item_a["links"]) == 2
    urls_a = [link["url"] for link in fetched_item_a["links"]]
    assert "https://example.com/tokyo1" in urls_a
    assert "https://example.com/tokyo2" in urls_a

    # Verify item B
    assert fetched_item_b["title"] == "Skydiving"
    assert len(fetched_item_b["links"]) == 0
