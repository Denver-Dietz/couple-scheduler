## 2024-10-07 - N+1 Query Anti-Pattern in List Endpoints
**Learning:** The backend has nested objects (comments, reactions) attached to parent entities (journals, memories) in loop iterations causing N+1 queries. SQLite has a ~999 parameter limit in `IN` clauses, meaning we must chunk our variables if we fetch children in batches to avoid `sqlite3.OperationalError: too many SQL variables`.
**Action:** Replace looped child database queries with batched `IN` queries split into chunks of 900 to resolve N+1 overhead without hitting parameter limits.
