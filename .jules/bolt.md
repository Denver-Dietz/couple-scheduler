## 2024-05-14 - Resolve N+1 query problem limits
**Learning:** Resolving N+1 query problems in SQLite via IN clauses requires batched variable lists to avoid the `sqlite3.OperationalError: too many SQL variables` exception.
**Action:** When querying child records for parent sets, safely chunk arrays into batch lengths of 900 or fewer parameters, then attach children via in-memory dictionary lookups.
