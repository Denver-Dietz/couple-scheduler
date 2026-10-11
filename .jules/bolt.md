## 2024-05-24 - N+1 Query SQLite Limit
**Learning:** Found N+1 query in `api_get_journal_entries`. When fixing N+1 queries in this codebase using SQLite `IN` clauses, we must chunk the variables (e.g., 900) because SQLite has a ~999 parameter limit, otherwise it raises `sqlite3.OperationalError`.
**Action:** Always batch `IN` clause parameters in chunks of <= 900 and assemble relationships in memory when optimizing database fetches.
