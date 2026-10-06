🧪 [Testing] Add unit tests for create_bucket_list_item API endpoint

🎯 **What:** The testing gap for the `create_bucket_list_item` endpoint in `backend/bucket_list_api.py` has been addressed. The project previously lacked a formal testing suite for backend API endpoints, making it susceptible to database insertion or payload validation regressions.

📊 **Coverage:** A new test suite was initialized with Pytest, testing three critical paths for bucket list item creation:
1. `test_create_bucket_list_item`: Verifies happy-path scenario with all available schema attributes appropriately populating DB.
2. `test_create_bucket_list_item_minimal`: Verifies inserting a sparse payload functions identically, testing database null insertion paths.
3. `test_create_bucket_list_item_invalid_payload`: Verifies payload integrity rules reject invalid/missing properties properly, validating endpoint security.

✨ **Result:** Improved confidence during API refactors for the bucket list domain, increasing test coverage. The codebase now natively utilizes pytest fixtures to ensure temporary mock databases are cleanly rolled back between test contexts without polluting production database stores.
