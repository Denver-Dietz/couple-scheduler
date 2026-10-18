## 2024-10-18 - Fix N+1 queries in Journal and Memory Endpoints
**Learning:** Fixing N+1 queries using `IN (?, ...)` must be chunked (e.g. 900) to prevent exceeding SQLite max variable parameter limit. Also, mapping results back must strictly use an O(1) hash map lookup rather than list-scanning generators to avoid severe O(N^2) regressions in Python.
**Action:** Always batch related child lookups using chunked `IN` queries and group them with O(1) dictionary mapping on parent ID.
