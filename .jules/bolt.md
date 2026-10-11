## 2024-10-11 - Resolving N+1 SQLite queries with Batching
**Learning:** Naively fixing N+1 queries using an `IN` clause can trigger `sqlite3.OperationalError: too many SQL variables` because SQLite limits query parameters (~999 limit).
**Action:** Always batch variables in chunks (e.g., 900) when constructing `IN` clauses for SQLite, and group child records in memory (using `defaultdict`) to attach them to parents.
