## 2024-05-18 - SQLite N+1 IN Clause Limits
**Learning:** This codebase uses SQLite, which has a ~999 parameter limit. Using IN clauses for N+1 queries without chunking can cause `sqlite3.OperationalError: too many SQL variables`.
**Action:** When fixing N+1 queries by replacing iterative SELECTs with IN clauses, batch the IDs in chunks (e.g., 900) and attach children to parents in memory using a dictionary.
