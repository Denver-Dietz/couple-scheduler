## 2024-03-24 - N+1 Queries in FastAPI SQLite Endpoints
**Learning:** Endpoints that loop through lists to fetch child items via `SELECT` queries cause classic N+1 query bottlenecks and degrade performance significantly as the app grows.
**Action:** Use batched `IN` queries (e.g. chunks of 900) instead of querying in a loop, and group the results in-memory.
