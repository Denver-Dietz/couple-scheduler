## 2024-10-09 - SQLite N+1 Batched IN Queries
**Learning:** Resolving N+1 query problems in this SQLite-backed application by querying child records with an 'IN' clause requires chunking variables (e.g., 900) to avoid `sqlite3.OperationalError: too many SQL variables` due to the ~999 parameter limit.
**Action:** Always batch variables when using an 'IN' clause and group child records in memory to attach them to parents.
