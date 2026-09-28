## 2024-10-25 - Avoid N+1 Queries in SQLite loops
**Learning:** Resolving N+1 database queries by querying for related entities inside a loop creates significant performance overhead, especially in Python iterating over SQLite cursors.
**Action:** When needing to fetch related 1-to-many entities (like comments for entries), batch the IDs using an `IN (?, ?, ?)` clause. However, since SQLite imposes a variable limit (often 999), always break the batched query into chunks (e.g. 900) to avoid `sqlite3.OperationalError: too many SQL variables`, then link them in memory.
