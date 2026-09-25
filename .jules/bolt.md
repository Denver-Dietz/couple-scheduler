## 2024-05-24 - Fix N+1 query in Memories and Journal APIs
**Learning:** SQLite backend hits 2N+1 queries for memory comments and reactions, as well as journal comments and reactions. By using an `IN` clause, we can cut this down to 3 queries. However, SQLite has a limit of ~999 variables per query. We must chunk the variables (e.g., chunks of 900) to avoid `sqlite3.OperationalError: too many SQL variables`.
**Action:** Use an `IN` clause for batch fetching child records, and chunk the parent IDs before querying.
