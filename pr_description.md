🎯 **What:**
Added missing test coverage for the error path of the `time_to_block` function in `backend/schedule_engine.py`. Added a test file `backend/tests/test_schedule_engine.py` using `pytest`.

📊 **Coverage:**
The tests cover both happy paths (valid hour/minute formatting, edge cases like '00:00' and '23:30') and the error condition path (invalid formatting like 'abc', '25:xx', '', `None`, and '12'), which returns 0.

✨ **Result:**
Improved test coverage on a core utility function ensuring invalid times return the expected fallback block value 0 without raising exceptions, preventing potential bugs on unhandled time formats.
