## 2024-05-14 - SQLite Parameter Limits and N+1 Batched Queries
**Learning:** SQLite has a maximum parameter limit (often 999) for operations. When converting N+1 queries to batched `IN (?,...)` queries to improve performance, we must chunk the ID lists (e.g. `batch_size = 900`) to prevent crashing the query if there are too many items.
**Action:** Whenever optimizing database queries with `IN` clauses, implement a loop that chunk the parameters into batches no larger than 900 to ensure safety while still retaining performance benefits.
