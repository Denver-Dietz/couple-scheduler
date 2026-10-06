## 2024-10-06 - Fixing N+1 Queries with SQLite Variable Limits
**Learning:** Found N+1 query patterns in `/api/journal` causing two extra queries per journal entry. When optimizing with an `IN` clause to batch the lookup in Python (hash map for O(1) matching), we must chunk the `IN` clause parameters to a maximum of ~999 per query, as SQLite raises `sqlite3.OperationalError: too many SQL variables` otherwise.
**Action:** Always batch queries with `IN` clauses into chunks of 900 and group child records in memory using a dictionary lookup to attach them to parents securely.
