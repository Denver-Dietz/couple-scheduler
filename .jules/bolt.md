## 2024-05-24 - N+1 Query Anti-Pattern in Timeline Endpoints
**Learning:** Endpoints returning lists with nested relations (e.g., `/api/journal` and `/api/memories`) iterate through fetched records and perform individual queries for comments and reactions per record. This N+1 querying creates a significant bottleneck (O(n) DB calls).
**Action:** Replace looped `SELECT` queries with batched `IN` clause queries (chunked to <= 900 to avoid SQLite limits), load all related child records into memory, and assign them to their respective parents. This achieves a ~10-15x speedup for large datasets.
