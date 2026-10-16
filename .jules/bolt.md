## 2024-05-15 - Fixed N+1 query in Journal API
**Learning:** Found an N+1 query loop fetching comments and reactions individually per journal entry. This scales linearly with the number of entries, causing backend lag.
**Action:** Replaced loop queries with batched `IN (?,?,...)` SQL queries to fetch all related data at once and map them in Python memory, changing time complexity from O(n) queries to O(1) queries.
