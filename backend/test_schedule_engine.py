import pytest
from backend.schedule_engine import time_to_block, block_to_time

def test_time_to_block_happy_path():
    assert time_to_block("00:00") == 0
    assert time_to_block("00:30") == 1
    assert time_to_block("01:00") == 2
    assert time_to_block("01:30") == 3
    assert time_to_block("10:15") == 20
    assert time_to_block("10:45") == 21
    assert time_to_block("23:59") == 47

def test_time_to_block_error_cases():
    assert time_to_block("abc") == 0
    assert time_to_block("12") == 0
    assert time_to_block(None) == 0
    assert time_to_block("") == 0
    assert time_to_block("invalid:time") == 0
    assert time_to_block("::") == 0

def test_block_to_time():
    assert block_to_time(0) == "00:00"
    assert block_to_time(1) == "00:30"
    assert block_to_time(2) == "01:00"
    assert block_to_time(3) == "01:30"
    assert block_to_time(20) == "10:00"
    assert block_to_time(21) == "10:30"
    assert block_to_time(47) == "23:30"
