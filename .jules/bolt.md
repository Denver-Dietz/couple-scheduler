
## 2024-10-04 - N+1 Queries on Journal & Memory Endpoints
**Learning:** `api_get_journal_entries` and `get_memories` endpoints heavily degraded performance by running nested `cursor.execute` queries for comments and reactions inside an unbatched `for` loop over each parent entry.
**Action:** When pulling related child records from SQLite, avoid looping over parents and executing individual queries. Use a batched `WHERE parent_id IN (...)` clause (chunked in limits like 900 to avoid SQLite variables exceptions) and combine the result using Python's `collections.defaultdict(list)`.
