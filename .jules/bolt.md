
## 2024-05-23 - Batching IN queries and Hash Map lookups
**Learning:** Fixing N+1 queries in sqlite often leads to performance regressions if mapping batched child query results back to their parent records is done via an O(N) list-scanning generator.
**Action:** Always strictly use an O(1) hash map lookup instead of an O(N) list-scanning generator. In addition, when implementing batched SQLite IN queries for child relations, always include an early return (e.g., if not items: return items) before constructing the query to prevent executing invalid SQL syntax (IN ()) when the parent list is empty.
