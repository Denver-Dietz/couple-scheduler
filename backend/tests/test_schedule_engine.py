import pytest
from backend.schedule_engine import get_day_index

def test_get_day_index_positive_difference():
    # 3 days after start_date
    assert get_day_index("2023-10-25", "2023-10-22") == 3

def test_get_day_index_negative_difference():
    # 2 days before start_date
    assert get_day_index("2023-10-20", "2023-10-22") == -2

def test_get_day_index_zero_difference():
    # Same day
    assert get_day_index("2023-10-22", "2023-10-22") == 0

def test_get_day_index_invalid_format():
    # Invalid format should be caught by except block and return 0
    assert get_day_index("invalid-date", "2023-10-22") == 0
    assert get_day_index("2023-10-22", "invalid-date") == 0
    assert get_day_index("10/22/2023", "10/20/2023") == 0

def test_get_day_index_with_time():
    # Only first 10 characters should be considered
    assert get_day_index("2023-10-25T14:30:00", "2023-10-22T08:00:00") == 3
    assert get_day_index("2023-10-25 14:30:00", "2023-10-22 08:00:00") == 3

def test_get_day_index_none_values():
    # None values should cause an exception on slicing/parsing, returning 0
    assert get_day_index(None, "2023-10-22") == 0
    assert get_day_index("2023-10-25", None) == 0
    assert get_day_index(None, None) == 0

def test_get_day_index_short_string():
    # Strings shorter than 10 characters
    assert get_day_index("2023", "2023-10-22") == 0
