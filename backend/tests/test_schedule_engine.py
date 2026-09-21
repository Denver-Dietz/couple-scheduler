import pytest
from schedule_engine import suggest_project_slots

def test_suggest_project_slots_empty_grid():
    grid = [[False] * 48 for _ in range(7)]
    options = suggest_project_slots(grid, hours_needed=2, start_date="2023-10-25")

    # hours_needed = 2 means chunk_blocks = 4.
    # 48 blocks per day / 4 = 12 options per day.
    # 12 * 7 days = 84 total options.
    assert len(options) == 84

    # Verify the first option
    assert options[0]['date'] == "2023-10-25"
    assert options[0]['start_time'] == "00:00"
    assert options[0]['end_time'] == "02:00"
    assert options[0]['allocated_hours'] == 2.0

def test_suggest_project_slots_busy_blocks():
    grid = [[False] * 48 for _ in range(7)]

    # Make block 1 (00:30-01:00) busy on day 0
    grid[0][1] = True

    options = suggest_project_slots(grid, hours_needed=2, start_date="2023-10-25")

    # The first possible 4-block chunk will start at block 2 (01:00)
    # The rest of day 0 (blocks 2 to 47) is 46 blocks. 46 / 4 = 11 options.
    # So day 0 will have 11 options, instead of 12.
    # Total = 11 + (12 * 6) = 11 + 72 = 83 options.
    assert len(options) == 83

    # The first option on day 0 should start at 01:00 (block 2)
    assert options[0]['date'] == "2023-10-25"
    assert options[0]['start_time'] == "01:00"
    assert options[0]['end_time'] == "03:00"

def test_suggest_project_slots_edge_cases():
    grid = [[False] * 48 for _ in range(7)]

    # Test capping at 8 blocks (4 hours) even if > 4 hours needed
    options_large = suggest_project_slots(grid, hours_needed=10, start_date="2023-10-25")
    assert options_large[0]['allocated_hours'] == 4.0
    assert options_large[0]['start_time'] == "00:00"
    assert options_large[0]['end_time'] == "04:00"

    # Test < 1 block
    options_small = suggest_project_slots(grid, hours_needed=0.1, start_date="2023-10-25")
    assert options_small[0]['allocated_hours'] == 0.5
    assert options_small[0]['start_time'] == "00:00"
    assert options_small[0]['end_time'] == "00:30"
