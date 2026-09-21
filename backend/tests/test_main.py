from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_delete_commitment_non_existent():
    # Send a DELETE request with a non-existent ID
    response = client.delete("/api/commitments/non-existent-id")

    # We expect a 200 OK because the backend currently gracefully handles it
    # by catching the sync error and deleting from DB (which does nothing if ID doesn't exist)
    assert response.status_code == 200
    assert response.json() == {"status": "deleted"}
