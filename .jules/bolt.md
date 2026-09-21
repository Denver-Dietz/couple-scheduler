## 2024-05-18 - Optimize DB Updates for Schedule Processing
**Learning:** Performing `execute()` calls inside a nested loop for large sets of inputs leads to severe N+1 database performance bottlenecks.
**Action:** When updating database records sequentially in a loop based on large payloads, accumulate the net changes in Python first (e.g. using a dictionary), then use `executemany()` to perform batch operations and drastically reduce the number of queries.
