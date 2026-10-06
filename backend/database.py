"""
Core database module for the Couple Scheduler application.
Manages the SQLite connection lifecycle, schema initialization, and global application settings.
"""

import sqlite3
import os
import json
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "scheduler.db")

def init_db():
    """
    Initializes the SQLite database schema if tables do not exist.
    This centralized schema definition ensures that all feature modules (Scheduler, Trip Planner, Memories, Bucket List)
    have their requisite tables created on application startup without manual migrations.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Execute the schema from schema.sql
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path, 'r') as f:
            cursor.executescript(f.read())
            
        # Execute migrations (ALTER TABLE statements that might fail if columns already exist)
        migrations = [
            "ALTER TABLE goals ADD COLUMN user_id TEXT DEFAULT 'user1'",
            "ALTER TABLE goals ADD COLUMN start_date TEXT",
            "ALTER TABLE goals ADD COLUMN ramp_offset INTEGER DEFAULT 0",
            "ALTER TABLE projects ADD COLUMN user_id TEXT DEFAULT 'user1'",
            "ALTER TABLE projects ADD COLUMN start_date TEXT",
            "ALTER TABLE commitments ADD COLUMN is_date BOOLEAN DEFAULT 0",
            "ALTER TABLE commitments ADD COLUMN date_idea_id TEXT",
            "ALTER TABLE commitments ADD COLUMN place TEXT",
            "ALTER TABLE commitments ADD COLUMN address TEXT",
            "ALTER TABLE commitments ADD COLUMN phone TEXT",
            "ALTER TABLE commitments ADD COLUMN website TEXT",
            "ALTER TABLE commitments ADD COLUMN notes TEXT",
            "ALTER TABLE bucket_list_items ADD COLUMN address TEXT",
            "ALTER TABLE schedules ADD COLUMN user_id TEXT DEFAULT 'both'"
        ]
        
        for migration in migrations:
            try:
                cursor.execute(migration)
            except sqlite3.OperationalError:
                pass

        conn.commit()

@contextmanager
def get_db():
    """
    Provides a transactional scope around a series of operations.
    Yields a database connection configured to return sqlite3.Row objects (for dict-like access).
    Ensures connections are properly closed even if exceptions occur, preventing connection leaks.
    
    Yields:
        sqlite3.Connection: An open database connection.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Helper for settings
def get_setting(key, default=None):
    """
    Retrieves a global setting from the 'settings' table.
    Values are automatically JSON-deserialized to support storing complex data structures (like arrays of authorized users)
    in the plain text SQLite column.
    
    Args:
        key (str): The setting key to fetch.
        default (any, optional): The fallback value if the key does not exist. Defaults to None.
        
    Returns:
        any: The deserialized setting value, or the default.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key=?", (key,))
        row = cursor.fetchone()
        if row:
            try:
                return json.loads(row['value'])
            except:
                return row['value']
        return default

def set_setting(key, value):
    """
    Inserts or updates a global setting in the 'settings' table.
    Complex types (dicts, lists) are JSON-serialized before storage to ensure data integrity
    within the SQLite text constraints.
    
    Args:
        key (str): The setting key to store.
        value (any): The value to store.
    """
    if isinstance(value, (dict, list)):
        value = json.dumps(value)
    elif not isinstance(value, str):
        value = str(value)
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            (key, value)
        )
        conn.commit()
