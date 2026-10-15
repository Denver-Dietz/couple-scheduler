## 2024-10-15 - SQLite Variable Limit in Batched Queries
**Learning:** Resolving N+1 queries via `IN (...)` clauses in this SQLite-backed app can cause `sqlite3.OperationalError: too many SQL variables` if the number of variables exceeds the ~999 parameter limit.
**Action:** Always batch variables in chunks of 900 when using `IN` clauses for eager loading relationships in this codebase.
