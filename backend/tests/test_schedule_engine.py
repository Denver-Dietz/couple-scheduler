import pytest
import sys
import os

# Add the parent directory to sys.path to import modules from backend/
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from schedule_engine import time_to_block

def test_time_to_block_standard():
    assert time_to_block("00:00") == 0
    assert time_to_block("00:30") == 1
    assert time_to_block("01:00") == 2
    assert time_to_block("01:30") == 3
    assert time_to_block("12:00") == 24
    assert time_to_block("12:30") == 25
    assert time_to_block("23:00") == 46
    assert time_to_block("23:30") == 47

def test_time_to_block_edge_cases():
    assert time_to_block("01:29") == 2
    assert time_to_block("01:31") == 3
    assert time_to_block("01:59") == 3

def test_time_to_block_invalid_inputs():
    assert time_to_block("invalid") == 0
    assert time_to_block("") == 0
    assert time_to_block(None) == 0
    assert time_to_block("12") == 0
    assert time_to_block("12-30") == 0
