## 2025-02-18 - SQLite Batching limits
**Learning:** SQLite has a hard limit on query variables (~999). When solving N+1 queries by replacing loops with `IN` clauses, passing more than 999 primary keys at once will crash the query (`sqlite3.OperationalError: too many SQL variables`).
**Action:** When optimizing N+1 database queries with `IN` clauses in SQLite, strictly chunk the variables list (e.g., in batches of 900) to respect the parameter limits.
