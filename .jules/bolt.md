## 2024-05-24 - SQLite IN Clause Limit
**Learning:** SQLite has a hard limit of 999 SQL variables per statement. When performing a batch `IN` query, a large array of IDs will cause a `sqlite3.OperationalError: too many SQL variables`.
**Action:** Always batch array values in an `IN` clause to a safe limit, such as 900.
