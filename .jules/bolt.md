## 2024-10-06 - N+1 Query in SQLite IN Clause Batching
**Learning:** When resolving N+1 queries using an `IN` clause in SQLite, you must batch the parameter chunk size under the historic 999 parameter limit (`sqlite3.OperationalError: too many SQL variables`). A safe chunk size is 900.
**Action:** Always chunk `IN` clause payloads iteratively and reassemble the grouped responses in memory before returning them to avoid SQLite engine crashes on large datasets.
