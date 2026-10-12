## 2024-10-12 - Fix N+1 queries in SQLite
**Learning:** Found N+1 query patterns in the Journal and Memories API endpoints causing significant latency (each entry spawned 2 extra queries).
**Action:** When querying child records for lists in SQLite, use chunked `IN` queries (e.g. chunks of 900 to avoid variable limits) to attach child records in memory, cutting latency by over 10x.
