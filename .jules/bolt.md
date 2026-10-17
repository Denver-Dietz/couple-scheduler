## 2024-10-18 - Database N+1 Anti-Pattern
**Learning:** Found a recurring N+1 query anti-pattern in the codebase when fetching nested relational data (e.g., comments and reactions for journal entries and memories).
**Action:** When fixing these N+1 bottlenecks by batching SQLite queries using the `IN (?,...)` clause, always implement array chunking (e.g., batches of 900) to avoid exceeding SQLite's max variable parameter limit.
