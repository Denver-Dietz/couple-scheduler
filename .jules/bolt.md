## 2024-10-19 - Batched Relations Query
**Learning:** In endpoints that return a list of parent entities (like journal entries or memories), looping over them and fetching their comments/reactions individually introduces severe N+1 performance bottlenecks.
**Action:** Use an O(1) batched database approach with SQLite's `IN (?,...)` clause, making sure to chunk queries (e.g. 900 items) to stay within the query parameter limits, and reconstruct the relation objects using an in-memory dictionary.
