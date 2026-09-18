## 2024-05-24 - Resolving N+1 SQLite query bottleneck
**Learning:** Found an N+1 issue in `backend/main.py` where `api_get_journal_entries` fetched all journal entries and then executed two additional queries (`SELECT * FROM journal_comments WHERE entry_id = ?` and `SELECT * FROM journal_reactions WHERE entry_id = ?`) inside a loop for each entry.
**Action:** Apply the optimization pattern of fetching parent items, then using their IDs to fetch all associated items in a single query (`IN (...)`), and map them in memory using a dictionary lookup.
