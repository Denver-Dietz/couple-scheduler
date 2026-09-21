## 2025-02-12 - Ensure proper dependencies for Python testing
**Learning:** Pytest requires all dependencies of the application to be installed even if not directly imported in the test, since `app` from `backend.main` is imported. If `telegram` or `google-genai` is used in the app, it needs to be installed in the environment where `pytest` is running.
**Action:** Before running tests, ensure the virtual environment has `pip install -r backend/requirements.txt` executed, or explicitly install necessary dependencies when failures occur.

## 2025-02-12 - Proper handling of non-existent SQLite columns
**Learning:** SQLite's `cursor.execute("INSERT INTO trips (id, couple_id, trip_type, destination, status) ...")` will fail with an `OperationalError: table trips has no column named trip_type` if the column is absent from the schema definition in `database.py`.
**Action:** When working with DB insertions, verify the table schema in `backend/database.py` (e.g., using `grep -A 10 "CREATE TABLE"`) to ensure all referenced columns actually exist before modifying SQL statements.
