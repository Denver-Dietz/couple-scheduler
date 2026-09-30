## 2024-09-30 - Resolving N+1 with Batching
**Learning:** When resolving N+1 queries in SQLite using an 'IN' clause, always chunk the parameters (e.g., 900) to avoid `sqlite3.OperationalError: too many SQL variables`.
**Action:** Use chunked batch queries and group related records in memory instead of calling the database in a loop.
