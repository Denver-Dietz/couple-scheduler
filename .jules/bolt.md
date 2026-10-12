## 2024-10-12 - Batched N+1 Queries with SQLite IN Limits
**Learning:** When resolving N+1 queries in SQLite using an 'IN' clause (e.g., `SELECT * FROM comments WHERE entry_id IN (?, ?, ...)`), the engine imposes a strict limit of 999 variables.
**Action:** When converting sequential queries to a single batched query, always chunk the parameters (e.g., to chunks of 900) to avoid the `sqlite3.OperationalError: too many SQL variables` exception while mapping child rows back to parent records in memory.
