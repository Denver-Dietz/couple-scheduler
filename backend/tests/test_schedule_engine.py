import pytest
from schedule_engine import get_day_index

def test_get_day_index_success():
    # Same day
    assert get_day_index("2023-10-01", "2023-10-01") == 0
    # Next day
    assert get_day_index("2023-10-02", "2023-10-01") == 1
    # Previous day
    assert get_day_index("2023-09-30", "2023-10-01") == -1

def test_get_day_index_exception():
    # Invalid date format should trigger the exception block and return 0
    assert get_day_index("invalid-date", "2023-10-01") == 0
    assert get_day_index("2023-10-01", "invalid-date") == 0
    assert get_day_index(None, "2023-10-01") == 0
