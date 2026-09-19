## 2024-10-24 - N+1 Queries in Backend List Endpoints
**Learning:** Returning nested lists (comments/reactions) for multiple items sequentially creates severe N+1 query bottlenecks that won't scale.
**Action:** Always batch fetch related resources using an `IN (...)` clause and combine results in memory using a dictionary for fast lookup instead of querying the DB in a loop.
