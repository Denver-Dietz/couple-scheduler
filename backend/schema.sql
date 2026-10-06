CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );

CREATE TABLE IF NOT EXISTS commitments (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT,
            start_time TEXT,
            end_time TEXT,
            is_fixed BOOLEAN DEFAULT 1,
            raw_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

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
        );

CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id TEXT DEFAULT 'user1',
            title TEXT,
            total_hours INTEGER,
            hours_allocated INTEGER DEFAULT 0,
            start_date TEXT,
            deadline TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE IF NOT EXISTS date_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date_idea_id TEXT UNIQUE,
            user1_swipe TEXT DEFAULT 'none',
            user2_swipe TEXT DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE IF NOT EXISTS schedules (
            id TEXT PRIMARY KEY,
            start_date TEXT,
            end_date TEXT,
            schedule_json TEXT,
            user_id TEXT DEFAULT 'both',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE IF NOT EXISTS work_shifts (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            date TEXT,
            start_time TEXT,
            end_time TEXT,
            label TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE IF NOT EXISTS sleep_schedules (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            schedule_type TEXT,
            schedule_value TEXT,
            start_time TEXT,
            end_time TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE IF NOT EXISTS exemptions (
            id TEXT PRIMARY KEY,
            item_id TEXT,
            item_type TEXT,
            skip_week_start TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE IF NOT EXISTS journal_entries (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

CREATE TABLE IF NOT EXISTS journal_comments (
            id TEXT PRIMARY KEY,
            entry_id TEXT,
            user_id TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (entry_id) REFERENCES journal_entries(id)
        );

CREATE TABLE IF NOT EXISTS journal_reactions (
            id TEXT PRIMARY KEY,
            entry_id TEXT,
            user_id TEXT,
            reaction TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (entry_id) REFERENCES journal_entries(id)
        );

CREATE TABLE IF NOT EXISTS check_ins (
            id TEXT PRIMARY KEY,
            couple_id TEXT,
            month_year TEXT,
            status TEXT DEFAULT 'pending'
        );

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
        );

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
        );

CREATE TABLE IF NOT EXISTS memory_comments (
            id TEXT PRIMARY KEY,
            memory_id TEXT,
            user_id TEXT,
            comment_text TEXT,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (memory_id) REFERENCES memories(id)
        );

CREATE TABLE IF NOT EXISTS memory_reactions (
            id TEXT PRIMARY KEY,
            memory_id TEXT,
            user_id TEXT,
            reaction_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (memory_id) REFERENCES memories(id)
        );

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
        );

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
        );

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
        );

CREATE TABLE IF NOT EXISTS trip_budget (
            id TEXT PRIMARY KEY,
            trip_id TEXT,
            category TEXT,
            estimated REAL DEFAULT 0,
            actual REAL DEFAULT 0,
            paid_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        );

CREATE TABLE IF NOT EXISTS trip_logistics (
            id TEXT PRIMARY KEY,
            trip_id TEXT,
            type TEXT,
            details TEXT,
            files TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        );

CREATE TABLE IF NOT EXISTS trip_map_items (
            id TEXT PRIMARY KEY,
            trip_id TEXT,
            coordinates TEXT,
            category TEXT,
            linked_itinerary_item_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        );

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
        );

CREATE TABLE IF NOT EXISTS bucket_list_links (
            id TEXT PRIMARY KEY,
            bucket_list_item_id TEXT,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bucket_list_item_id) REFERENCES bucket_list_items(id)
        );
