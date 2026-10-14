## 2024-05-24 - N+1 Query Anti-Pattern
**Learning:** Found an N+1 query problem in the `/api/memories` and `/api/journal` endpoints. Doing a query per item inside a for-loop adds massive overhead as data scales.
**Action:** Always batch related child lookups using an IN clause (with a maximum of 900 items to avoid SQLite variable limits) and join them in memory.
