import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from backend.trips_api import trips_router
from unittest.mock import MagicMock

app = FastAPI()
app.include_router(trips_router)
client = TestClient(app)

def test_get_trip_success(mocker):
    # Mock the database context manager
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor

    mock_get_db = mocker.patch("backend.trips_api.get_db")
    mock_get_db.return_value.__enter__.return_value = mock_conn

    # Mock the fetch_trip_data function
    mock_fetch = mocker.patch("backend.trips_api.fetch_trip_data")

    mock_trip_data = {
        "id": "trip123",
        "name": "Test Trip",
        "dates": "2023-10-01 to 2023-10-10",
        "destination": "Paris",
        "itinerary": [],
        "wishlist": [],
        "budget": [],
        "logistics": [],
        "map_items": []
    }
    mock_fetch.return_value = mock_trip_data

    response = client.get("/api/trips/trip123")

    assert response.status_code == 200
    assert response.json() == mock_trip_data
    mock_fetch.assert_called_once_with(mock_cursor, "trip123")

def test_get_trip_not_found(mocker):
    # Mock the database context manager
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor

    mock_get_db = mocker.patch("backend.trips_api.get_db")
    mock_get_db.return_value.__enter__.return_value = mock_conn

    # Mock the fetch_trip_data function to return None
    mock_fetch = mocker.patch("backend.trips_api.fetch_trip_data")
    mock_fetch.return_value = None

    response = client.get("/api/trips/nonexistent_trip")

    assert response.status_code == 404
    assert response.json() == {"detail": "Trip not found"}
    mock_fetch.assert_called_once_with(mock_cursor, "nonexistent_trip")
