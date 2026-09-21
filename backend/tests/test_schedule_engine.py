from schedule_engine import block_to_time

def test_block_to_time():
    assert block_to_time(0) == "00:00"
    assert block_to_time(1) == "00:30"
    assert block_to_time(2) == "01:00"
    assert block_to_time(47) == "23:30"
    assert block_to_time(48) == "24:00"
