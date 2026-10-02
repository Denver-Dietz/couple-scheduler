## 2024-05-18 - SQLite IN Clause Limits
**Learning:** SQLite has a strict limit on the number of parameters allowed in a single query (usually 999). When resolving N+1 queries using an `IN (...)` clause, a large dataset could easily exceed this limit, causing an operational error.
**Action:** When querying the SQLite database using an 'IN' clause, always batch the variables in chunks (e.g., 900) and loop through them. Group child records in memory to attach them to parents.
