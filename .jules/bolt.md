## 2024-05-24 - Resolve SQLite N+1 Queries with Chunked IN Clauses
**Learning:** Resolving N+1 query problems in Python with SQLite `IN (...)` clauses can crash with `sqlite3.OperationalError: too many SQL variables` because SQLite imposes a strict maximum on bound parameters per query (typically 999).
**Action:** When querying the database using an `IN` clause with a dynamic list of variables, always batch the variables in chunks (e.g., `chunk_size = 900`) and loop over the chunks to stitch the grouped child records back onto the parents in memory.
