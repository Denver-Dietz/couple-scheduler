
## 2024-05-18 - Batching DB Writes with executemany
**Learning:** SQLite database writes in loops (e.g. `conn.execute(...)` inside a `for` loop) can be a significant bottleneck due to per-query overhead.
**Action:** When inserting multiple rows derived from list-like structures (such as parsed appointments), always gather the parameter tuples using a list comprehension and insert them in a single batch using `conn.executemany(...)`.
