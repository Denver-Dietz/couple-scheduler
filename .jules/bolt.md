## 2024-05-19 - N+1 Query bottleneck pattern in API handlers
**Learning:** Found N+1 query bottlenecks in API endpoints where related data (e.g., comments and reactions for journal entries and memories) was fetched iteratively inside a loop. This degrades performance significantly as data volume increases.
**Action:** When fetching relational records from SQLite, batch them by collecting item IDs and executing a single query with an `IN` clause (chunking arrays by 900 to circumvent SQLite's parameter limits), then constructing in-memory hash maps to assign nested relations.
