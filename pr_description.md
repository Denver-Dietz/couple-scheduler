💡 **What:**
Aggregated the project hour durations by `item_id` in Python (using a `defaultdict(float)`) before updating the SQLite database. Then, replaced individual `cursor.execute` calls inside a loop with a single `cursor.executemany` statement.

🎯 **Why:**
The previous implementation looped through all the items in the `api_submit_schedule` endpoint and issued individual `UPDATE` queries for each project hours adjustment (N+1 query problem). This becomes significantly inefficient when dealing with larger sets of schedule slots, increasing DB CPU/IO overhead and response latency. By doing the aggregation in-memory before issuing the database statements, the latency is significantly reduced.

📊 **Measured Improvement:**
I established a benchmark (`backend/benchmark.py`) representing 10,000 schedule slots mapping to 100 projects.
- **Baseline Average Time:** `0.1004s`
- **Optimized Average Time:** `0.0649s`
- **Change:** A roughly ~35% performance improvement for large schedules when aggregating in memory and using `executemany`.
