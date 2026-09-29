
## 2024-05-18 - SQLite N+1 Anti-Pattern
**Learning:** The previous code fetched relations (like comments/reactions) one by one inside a loop. Since SQLite lacks strong concurrent connection pooling by default, these synchronous N+1 queries added severe latency (O(N)) overhead. When batching them with `IN` queries, we must chunk parameters (e.g. 900) because SQLite limits query variables to ~999.
**Action:** Always batch related SQLite queries in `O(1)` operations using `IN` clauses with chunk limits (~900 variables) instead of N+1 looping when retrieving relational data like comments or reactions.
