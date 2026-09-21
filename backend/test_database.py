import sqlite3
from contextlib import contextmanager
import json
import pytest

from backend.database import get_setting

@pytest.fixture
def memory_db(mocker):
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )
    ''')
    conn.commit()

    @contextmanager
    def mock_get_db():
        yield conn

    mocker.patch('backend.database.get_db', mock_get_db)

    yield conn
    conn.close()

def test_get_setting_returns_default_when_key_not_found(memory_db):
    """Test that missing keys return None or the provided default."""
    assert get_setting('non_existent_key') is None
    assert get_setting('non_existent_key', 'my_default') == 'my_default'

def test_get_setting_returns_json_deserialized_value(memory_db):
    """Test that valid JSON strings are automatically parsed."""
    memory_db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", ('my_key', '{"a": 1, "b": [2, 3]}'))
    memory_db.commit()

    result = get_setting('my_key')
    assert result == {"a": 1, "b": [2, 3]}
    assert type(result) == dict

def test_get_setting_returns_raw_string_if_not_json(memory_db):
    """Test that invalid JSON falls back to returning the raw string."""
    memory_db.execute("INSERT INTO settings (key, value) VALUES (?, ?)", ('my_key', 'raw string value'))
    memory_db.commit()

    result = get_setting('my_key')
    assert result == 'raw string value'
    assert type(result) == str
