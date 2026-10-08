## 2024-05-22 - SQLite IN Clause Parameter Limit
**Learning:** When resolving N+1 queries using an IN clause, SQLite throws `sqlite3.OperationalError: too many SQL variables` if there are more than 999 parameters. Grouping child records in memory is fast, but the IN clause arguments must be chunked (e.g., to 900) to prevent this limit.
**Action:** Always batch IN clause parameters in chunks of 900 when resolving N+1 queries in this SQLite-backed codebase.
