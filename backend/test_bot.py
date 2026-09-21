import pytest
from datetime import datetime
from backend.bot import format_time_ampm

def test_format_time_ampm_empty_and_none():
    assert format_time_ampm("") == "TBD"
    assert format_time_ampm(None) == "TBD"

def test_format_time_ampm_off():
    assert format_time_ampm("off") == "Off"

def test_format_time_ampm_iso():
    # ISO strings format as "%b %d, %I:%M %p"
    assert format_time_ampm("2023-10-25T14:30:00") == "Oct 25, 02:30 PM"
    assert format_time_ampm("2023-01-05T09:15:00") == "Jan 05, 09:15 AM"

def test_format_time_ampm_hm():
    # HH:MM strings format as "%I:%M %p" without leading 0
    assert format_time_ampm("14:30") == "2:30 PM"
    assert format_time_ampm("09:15") == "9:15 AM"
    assert format_time_ampm("00:00") == "12:00 AM"
    assert format_time_ampm("12:00") == "12:00 PM"
    assert format_time_ampm("9:15") == "9:15 AM" # Missing leading zero works for python datetime parsing

def test_format_time_ampm_hms():
    # HH:MM:SS strings format as "%I:%M %p" without leading 0
    assert format_time_ampm("14:30:45") == "2:30 PM"
    assert format_time_ampm("09:15:30") == "9:15 AM"
    assert format_time_ampm("00:00:00") == "12:00 AM"

def test_format_time_ampm_invalid_fallback():
    # If it fails all formats, it returns the original string
    assert format_time_ampm("invalid string") == "invalid string"
    assert format_time_ampm("14/30") == "14/30"
