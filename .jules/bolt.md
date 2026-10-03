## 2024-05-20 - [SQLite IN Clause Limits]
**Learning:** When resolving N+1 queries using an `IN` clause with an in-memory SQLite database, we must batch the variables in chunks (e.g., 900) to avoid the `sqlite3.OperationalError: too many SQL variables` exception. SQLite has a ~999 parameter limit.
**Action:** Always chunk the IDs array (e.g., `[ids[i:i + 900] for i in range(0, len(ids), 900)]`) when performing batch lookups in SQLite to prevent runtime errors.
