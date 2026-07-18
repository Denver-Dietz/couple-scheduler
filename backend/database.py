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
        
        # Settings table (API keys, Telegram bot token, allowed users, sleep/work hours)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
        ''')
        
        # Fixed commitments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS commitments (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            start_time TEXT,
            end_time TEXT,
            is_fixed BOOLEAN DEFAULT 1,
            raw_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Goals table (Flexible habits)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'user1',
            title TEXT,
            duration_minutes INTEGER,
            target_per_week INTEGER,
            preferred_time_of_day TEXT,
            start_date TEXT,
            ramp_offset INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Projects table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'user1',
            title TEXT,
            total_hours INTEGER,
            hours_allocated INTEGER DEFAULT 0,
            start_date TEXT,
            deadline TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Date Matches table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS date_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_idea_id TEXT UNIQUE,
            user1_swipe TEXT DEFAULT 'none',
            user2_swipe TEXT DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Run schema migrations in case tables exist
        try:
            cursor.execute("ALTER TABLE goals ADD COLUMN user_id TEXT DEFAULT 'user1'")
        except sqlite3.OperationalError:
            pass
            
        try:
            cursor.execute("ALTER TABLE goals ADD COLUMN start_date TEXT")
        except sqlite3.OperationalError:
            pass
            
        try:
            cursor.execute("ALTER TABLE goals ADD COLUMN ramp_offset INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
            
        try:
            cursor.execute("ALTER TABLE projects ADD COLUMN user_id TEXT DEFAULT 'user1'")
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("ALTER TABLE projects ADD COLUMN start_date TEXT")
        except sqlite3.OperationalError:
            pass
            
        # Commitments Date Fields Migration
        try:
            cursor.execute("ALTER TABLE commitments ADD COLUMN is_date BOOLEAN DEFAULT 0")
            cursor.execute("ALTER TABLE commitments ADD COLUMN date_idea_id TEXT")
            cursor.execute("ALTER TABLE commitments ADD COLUMN place TEXT")
            cursor.execute("ALTER TABLE commitments ADD COLUMN address TEXT")
            cursor.execute("ALTER TABLE commitments ADD COLUMN phone TEXT")
            cursor.execute("ALTER TABLE commitments ADD COLUMN website TEXT")
            cursor.execute("ALTER TABLE commitments ADD COLUMN notes TEXT")
        except sqlite3.OperationalError:
            pass
            
        try:
            cursor.execute("ALTER TABLE bucket_list_items ADD COLUMN address TEXT")
        except sqlite3.OperationalError:
            pass
        
        # Schedules table (Generated JSON outputs from Gemini)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS schedules (
            id TEXT PRIMARY KEY,
            start_date TEXT,
            end_date TEXT,
            schedule_json TEXT,
            user_id TEXT DEFAULT 'both',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        try:
            cursor.execute("ALTER TABLE schedules ADD COLUMN user_id TEXT DEFAULT 'both'")
        except sqlite3.OperationalError:
            pass
        
        # Work shifts table (Fluctuating work schedules)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS work_shifts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            date TEXT,
            start_time TEXT,
            end_time TEXT,
            label TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        # Sleep schedules table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS sleep_schedules (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            schedule_type TEXT,
            schedule_value TEXT,
            start_time TEXT,
            end_time TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Exemptions table (items pushed/skipped for a specific week)
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS exemptions (
            id TEXT PRIMARY KEY,
            item_id TEXT,
            item_type TEXT,
            skip_week_start TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Journal Entries
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_entries (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Journal Comments
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_comments (
            id TEXT PRIMARY KEY,
            entry_id TEXT,
            user_id TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (entry_id) REFERENCES journal_entries(id)
        )
        ''')
        
        # Journal Reactions
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS journal_reactions (
            id TEXT PRIMARY KEY,
            entry_id TEXT,
            user_id TEXT,
            reaction TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (entry_id) REFERENCES journal_entries(id)
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS check_ins (
            id TEXT PRIMARY KEY,
            couple_id TEXT,
            month_year TEXT,
            status TEXT DEFAULT 'pending'
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS check_in_responses (
            id TEXT PRIMARY KEY,
            checkin_id TEXT,
            user_id TEXT,
            communication_score INTEGER,
            intimacy_score INTEGER,
            quality_time_score INTEGER,
            teamwork_score INTEGER,
            notes TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (checkin_id) REFERENCES check_ins(id)
        )
        ''')

        # Memories Core Table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS memories (
            id TEXT PRIMARY KEY,
            couple_id TEXT DEFAULT 'default',
            uploader_id TEXT,
            caption TEXT,
            event_type TEXT,
            captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            location TEXT,
            storage_url TEXT,
            processed_status TEXT DEFAULT 'pending'
        )
        ''')

        # Memory Comments
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS memory_comments (
            id TEXT PRIMARY KEY,
            memory_id TEXT,
            user_id TEXT,
            comment_text TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (memory_id) REFERENCES memories(id)
        )
        ''')

        # Memory Reactions
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS memory_reactions (
            id TEXT PRIMARY KEY,
            memory_id TEXT,
            user_id TEXT,
            reaction_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (memory_id) REFERENCES memories(id)
        )
        ''')

        # Trips
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS trips (
            id TEXT PRIMARY KEY,
            couple_id TEXT DEFAULT 'default',
            name TEXT,
            dates TEXT,
            destination TEXT,
            cover_photo TEXT,
            mood_tags TEXT,
            progress INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Trip Itinerary
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS trip_itinerary (
            id TEXT PRIMARY KEY,
            trip_id TEXT,
            day TEXT,
            title TEXT,
            time TEXT,
            location TEXT,
            notes TEXT,
            partner_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        )
        ''')

        # Trip Wishlist
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS trip_wishlist (
            id TEXT PRIMARY KEY,
            trip_id TEXT,
            title TEXT,
            category TEXT,
            votes_u1 INTEGER DEFAULT 0,
            votes_u2 INTEGER DEFAULT 0,
            partner_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        )
        ''')
        
        # Trip Budget
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS trip_budget (
            id TEXT PRIMARY KEY,
            trip_id TEXT,
            category TEXT,
            estimated REAL DEFAULT 0,
            actual REAL DEFAULT 0,
            paid_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        )
        ''')
        
        # Trip Logistics
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS trip_logistics (
            id TEXT PRIMARY KEY,
            trip_id TEXT,
            type TEXT,
            details TEXT,
            files TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        )
        ''')
        
        # Trip Map Items
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS trip_map_items (
            id TEXT PRIMARY KEY,
            trip_id TEXT,
            coordinates TEXT,
            category TEXT,
            linked_itinerary_item_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        )
        ''')

        # Bucket List Items
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS bucket_list_items (
            id TEXT PRIMARY KEY,
            couple_id TEXT DEFAULT 'default',
            item_type TEXT,
            title TEXT,
            status TEXT DEFAULT 'idea',
            estimated_cost TEXT,
            effort_level TEXT,
            latitude REAL,
            longitude REAL,
            address TEXT,
            cover_image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Bucket List Links
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS bucket_list_links (
            id TEXT PRIMARY KEY,
            bucket_list_item_id TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bucket_list_item_id) REFERENCES bucket_list_items(id)
        )
        ''')

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
