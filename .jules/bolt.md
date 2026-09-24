## 2024-05-24 - SQLite Variable Limit in Batch Queries
**Learning:** When optimizing N+1 query patterns by gathering IDs and doing bulk fetch with `WHERE id IN (...)` in SQLite, the number of placeholders is restricted by SQLite's SQLITE_MAX_VARIABLE_NUMBER (default 999). Exceeding this throws `sqlite3.OperationalError: too many SQL variables`.
**Action:** When using `.execute(f"... IN ({placeholders})", ids)`, always chunk the ID list into sizes safely below 999 (e.g. chunks of 900) in a for loop and append the results together.
