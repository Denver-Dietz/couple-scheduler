import pytest
from backend.bot import format_time_ampm

def test_format_time_ampm_invalid():
    assert format_time_ampm("25:99") == "25:99"
    assert format_time_ampm("invalid") == "invalid"

def test_format_time_ampm_valid():
    assert format_time_ampm("14:30") == "2:30 PM"
    assert format_time_ampm("09:05") == "9:05 AM"
    assert format_time_ampm("off") == "Off"
    assert format_time_ampm(None) == "TBD"
