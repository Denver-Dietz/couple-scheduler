## 2024-09-21 - Optimize SQLite Bulk Inserts

**Learning:** When inserting multiple rows into an SQLite database (e.g., parsing multiple appointments and storing them), executing an `INSERT` statement in a Python `for` loop causes overhead due to transaction management and query parsing happening per-row.

**Action:** Always prefer preparing a list of tuples and calling `conn.executemany(...)` which natively batches the operations, resulting in a >1.6x speedup.
