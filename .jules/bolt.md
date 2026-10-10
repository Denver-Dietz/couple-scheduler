## 2025-05-24 - Batching N+1 Queries in SQLite
**Learning:** Resolving N+1 query problems in SQLite using an 'IN' clause provides massive performance boosts (e.g. ~75% faster), but we must batch the IDs in chunks (e.g., 900) because SQLite has a strict limit on the number of parameters per query (~999).
**Action:** Always batch query variables into chunks (e.g., 900) when resolving N+1 queries using 'IN', and group the fetched child records in memory to attach them to their parents.
