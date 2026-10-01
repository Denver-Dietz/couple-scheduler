## 2024-10-01 - Resolving N+1 queries with batched IN clauses
**Learning:** When resolving N+1 queries using an SQLite 'IN' clause, the database parameter limit (~999 variables) can cause `sqlite3.OperationalError: too many SQL variables` if the list is too large.
**Action:** Always batch variables in chunks (e.g., 900) when constructing an 'IN' query in SQLite to avoid hitting the variable limit, and manually stitch the results back together in memory.
