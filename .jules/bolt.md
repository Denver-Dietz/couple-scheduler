## 2024-05-18 - N+1 Query Anti-Pattern in API List Endpoints
**Learning:** Found an N+1 query performance bottleneck in `backend/main.py`. The `api_get_journal_entries` and `get_memories` endpoints looped through all primary records to fetch related data (comments and reactions). This creates O(n) calls to the database which slows down dramatically as history grows.
**Action:** Use an `IN` clause with a placeholder string generated from IDs in Python to collect related data for multiple parent records via a single query (batch loading) instead of multiple individual queries, then map the data back using dictionary lookups.
## 2024-05-18 - SQLite Variable Binding Limits (`too many SQL variables`)
**Learning:** Found a production crashing bug in my earlier N+1 query optimization. Using `IN (?, ?, ...)` in SQLite throws `sqlite3.OperationalError: too many SQL variables` if there are more than 999 bindings.
**Action:** When pulling associated data for dynamic unbounded lists of IDs using `IN` query, batch the query execution in chunks of 900 to ensure we safely avoid SQLite parameter limits.
