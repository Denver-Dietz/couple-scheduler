## 2025-02-12 - Fix N+1 queries using batched IN clauses
**Learning:** Found N+1 query problem where getting list of journal entries and memories queried the DB in a loop for comments and reactions. SQLite has variable limits, so chunking is required for IN clauses.
**Action:** Changed loop queries to batched IN queries chunked by 900 variables to avoid SQLite variable limit (`sqlite3.OperationalError: too many SQL variables`), mapping child records to parents in memory. This greatly reduces total query times. Also remember to ignore __pycache__ while submitting.
