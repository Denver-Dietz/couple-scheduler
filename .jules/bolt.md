## 2024-10-01 - Fix N+1 query in Journal Entries API
**Learning:** SQLite has a hard limit on the number of variables (parameters) you can pass in a single query (typically around 999). When resolving an N+1 query problem by collecting IDs and doing a batch lookup with an `IN` clause, attempting to pass thousands of IDs as variables will throw a `sqlite3.OperationalError: too many SQL variables`.
**Action:** Always batch queries with `IN` clauses into chunks (e.g., 900) to safely bypass the SQLite parameter limit when resolving N+1 database queries.
