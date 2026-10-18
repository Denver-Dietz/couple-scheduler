## 2024-10-18 - SQLite N+1 Query Fix
**Learning:** Found N+1 query patterns in `api_get_journal_entries` and `get_memories` in `backend/main.py`. Because the backend uses SQLite, doing batched `IN (?,?,...)` queries needs to consider SQLite's parameter limits (historically 999). It is important to chunk the batches (e.g. by 900) to prevent `sqlite3.OperationalError: too many SQL variables`.
**Action:** Always implement chunked processing for batched `IN` queries in this codebase.
