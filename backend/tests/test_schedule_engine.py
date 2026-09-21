import pytest
from backend.schedule_engine import time_to_block

def test_time_to_block_valid():
    assert time_to_block('00:00') == 0
    assert time_to_block('00:29') == 0
    assert time_to_block('00:30') == 1
    assert time_to_block('01:00') == 2
    assert time_to_block('01:30') == 3
    assert time_to_block('23:00') == 46
    assert time_to_block('23:30') == 47

def test_time_to_block_invalid():
    # Error paths should return 0
    assert time_to_block('abc') == 0
    assert time_to_block('25:xx') == 0
    assert time_to_block('') == 0
    assert time_to_block(None) == 0
    assert time_to_block('12') == 0
