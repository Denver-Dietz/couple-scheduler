import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_memory_upload_secure_extension(tmp_path):
    # Create a dummy image file
    file_content = b"fake image content"

    # Send a request with a potentially malicious extension
    response = client.post(
        "/api/memories/upload",
        data={
            "user_id": "test_user",
            "caption": "A nice memory",
            "event_type": "candid",
            "location": "Paris"
        },
        # filename is constructed to have an extension `.ext/../foo`
        # python's os.path.splitext on `malicious.ext/../foo` gives ('malicious.ext/../foo', '')
        # but on `malicious.png/.exe` it gives ('malicious.png/.exe', '')
        # However, `os.path.splitext('malicious.ext/foo.bar')` gives `('malicious.ext/foo', '.bar')`
        files={"file": ("malicious.ext/../../foo.bar", file_content, "image/png")}
    )

    assert response.status_code == 200
    data = response.json()
    assert "url" in data

    # The URL shouldn't contain any path traversal characters in the extension
    assert ".." not in data["url"]
    assert data["url"].endswith(".bar")

def test_memory_upload_normal_extension(tmp_path):
    file_content = b"fake image content"

    response = client.post(
        "/api/memories/upload",
        data={
            "user_id": "test_user",
            "caption": "A nice memory",
            "event_type": "candid",
            "location": "Paris"
        },
        files={"file": ("normal_image.jpg", file_content, "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert "url" in data

    assert data["url"].endswith(".jpg")
