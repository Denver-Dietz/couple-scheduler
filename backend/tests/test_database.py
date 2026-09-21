import pytest
import sqlite3
import json
import os
import tempfile
from backend import database
from backend.database import set_setting, get_setting, init_db

@pytest.fixture(autouse=True)
def setup_database():
    """Setup a temporary database for testing."""
    # We need to monkeypatch the database path to use a temp file or in-memory DB
    fd, temp_db = tempfile.mkstemp()
    old_db_path = database.DB_PATH
    database.DB_PATH = temp_db

    # Initialize the tables
    init_db()

    yield

    # Cleanup
    os.close(fd)
    os.remove(temp_db)
    database.DB_PATH = old_db_path

def test_set_setting_json_serialization():
    # Test dictionary
    test_dict = {"key1": "value1", "key2": 2}
    set_setting("test_dict", test_dict)

    # Verify it was stored as a JSON string in the database
    with database.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", ("test_dict",))
        result = cursor.fetchone()

    assert result is not None
    # Check that it is a string representing JSON
    assert isinstance(result[0], str)
    assert json.loads(result[0]) == test_dict

    # get_setting will deserialize it back to dict
    assert get_setting("test_dict") == test_dict

    # Test list
    test_list = [1, 2, "three"]
    set_setting("test_list", test_list)

    # Verify list serialization
    with database.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", ("test_list",))
        result = cursor.fetchone()

    assert result is not None
    assert isinstance(result[0], str)
    assert json.loads(result[0]) == test_list

    # get_setting will deserialize it back to list
    assert get_setting("test_list") == test_list

    # Test string (should not be JSON serialized)
    test_str = "simple_string"
    set_setting("test_str", test_str)

    with database.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", ("test_str",))
        result = cursor.fetchone()

    assert result is not None
    assert result[0] == "simple_string"
    # Because get_setting tries json.loads first, "simple_string" will fail JSON decoding and return the string itself.
    assert get_setting("test_str") == "simple_string"

    # Test number (will be converted to string during set, then back to number by json.loads in get_setting if it's purely a number? Let's check)
    set_setting("test_int", 42)
    with database.get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", ("test_int",))
        result = cursor.fetchone()

    assert result is not None
    assert result[0] == "42"
    # get_setting will json.loads("42") -> 42
    assert get_setting("test_int") == 42
