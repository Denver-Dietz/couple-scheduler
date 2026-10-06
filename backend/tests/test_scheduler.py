import pytest
from unittest.mock import patch, MagicMock
from backend.scheduler import generate_schedule
import json

@pytest.fixture
def mock_get_setting():
    with patch("backend.scheduler.get_setting") as mock:
        yield mock

@pytest.fixture
def mock_get_db():
    with patch("backend.scheduler.get_db") as mock:
        yield mock

@pytest.fixture
def mock_genai():
    with patch("backend.scheduler.genai") as mock:
        yield mock

def test_missing_api_key(mock_get_setting):
    mock_get_setting.return_value = None
    with pytest.raises(Exception, match="Gemini API Key is not configured."):
        generate_schedule("2023-10-02", "2023-10-08")

def test_generate_schedule_success(mock_get_setting, mock_get_db, mock_genai):
    mock_get_setting.side_effect = lambda key, default=None: "dummy_key" if key == "gemini_api_key" else default

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value.__enter__.return_value = mock_conn

    # Mocking db returns for various tables
    # 1. commitments
    # 2. goals
    # 3. projects
    # 4. work_shifts
    # 5. sleep_schedules
    # 6. exemptions
    # 7. overlapping_trips
    mock_cursor.fetchall.side_effect = [
        [{"id": "c1", "title": "Commitment 1"}], # commitments
        [{"id": "g1", "title": "Goal 1", "target_per_week": 3, "start_date": "2023-09-25", "ramp_offset": 0}], # goals
        [{"id": "p1", "title": "Project 1"}], # projects
        [], # work_shifts
        [], # sleep_schedules
        [], # exemptions
        []  # trips
    ]

    mock_client_instance = MagicMock()
    mock_genai.Client.return_value = mock_client_instance
    mock_response = MagicMock()

    expected_schedule = {"days": {"2023-10-02": []}, "warnings": []}
    mock_response.text = f"```json\n{json.dumps(expected_schedule)}\n```"
    mock_client_instance.models.generate_content.return_value = mock_response

    schedule = generate_schedule("2023-10-02", "2023-10-08")
    assert schedule == expected_schedule

    # Ensure cursor.execute was called to insert the schedule
    insert_calls = [call for call in mock_cursor.execute.call_args_list if "INSERT INTO schedules" in call[0][0]]
    assert len(insert_calls) == 1

def test_generate_schedule_with_trips(mock_get_setting, mock_get_db, mock_genai):
    mock_get_setting.side_effect = lambda key, default=None: "dummy_key" if key == "gemini_api_key" else default

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value.__enter__.return_value = mock_conn

    # 1. commitments
    # 2. goals
    # 3. projects
    # 4. work_shifts
    # 5. sleep_schedules
    # 6. exemptions
    # 7. overlapping_trips
    mock_cursor.fetchall.side_effect = [
        [], # commitments
        [{"id": "g1", "title": "Goal 1", "target_per_week": 3}], # goals
        [{"id": "p1", "title": "Project 1"}], # projects
        [], # work_shifts
        [], # sleep_schedules
        [], # exemptions
        [{"destination": "Hawaii", "start_date": "2023-10-02", "end_date": "2023-10-05"}]  # trips
    ]

    mock_client_instance = MagicMock()
    mock_genai.Client.return_value = mock_client_instance
    mock_response = MagicMock()

    expected_schedule = {"days": {}, "warnings": []}
    mock_response.text = json.dumps(expected_schedule) # Without markdown
    mock_client_instance.models.generate_content.return_value = mock_response

    schedule = generate_schedule("2023-10-02", "2023-10-08")
    assert schedule == expected_schedule

    # check the prompt to see if goals and projects were cleared and trip was injected
    prompt = mock_client_instance.models.generate_content.call_args[1]['contents']
    assert "TRIP: Hawaii" in prompt
    assert "Goal 1" not in prompt
    assert "Project 1" not in prompt

def test_generate_schedule_with_exemptions(mock_get_setting, mock_get_db, mock_genai):
    mock_get_setting.side_effect = lambda key, default=None: "dummy_key" if key == "gemini_api_key" else default

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value.__enter__.return_value = mock_conn

    # 1. commitments
    # 2. goals
    # 3. projects
    # 4. work_shifts
    # 5. sleep_schedules
    # 6. exemptions
    # 7. overlapping_trips
    mock_cursor.fetchall.side_effect = [
        [], # commitments
        [{"id": "g1", "title": "Goal 1", "target_per_week": 3}], # goals
        [{"id": "p1", "title": "Project 1"}], # projects
        [], # work_shifts
        [], # sleep_schedules
        [{"item_id": "g1", "skip_week_start": "2023-10-02"}, {"item_id": "p1", "skip_week_start": "2023-10-02"}], # exemptions
        []  # trips
    ]

    mock_client_instance = MagicMock()
    mock_genai.Client.return_value = mock_client_instance
    mock_response = MagicMock()

    expected_schedule = {"days": {}, "warnings": []}
    mock_response.text = json.dumps(expected_schedule)
    mock_client_instance.models.generate_content.return_value = mock_response

    schedule = generate_schedule("2023-10-02", "2023-10-08")
    assert schedule == expected_schedule

    prompt = mock_client_instance.models.generate_content.call_args[1]['contents']
    assert "Goal 1" not in prompt
    assert "Project 1" not in prompt


def test_invalid_json_from_llm(mock_get_setting, mock_get_db, mock_genai):
    mock_get_setting.side_effect = lambda key, default=None: "dummy_key" if key == "gemini_api_key" else default

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value.__enter__.return_value = mock_conn

    # 1. commitments
    # 2. goals
    # 3. projects
    # 4. work_shifts
    # 5. sleep_schedules
    # 6. exemptions
    # 7. overlapping_trips
    mock_cursor.fetchall.side_effect = [
        [], [], [], [], [], [], []
    ]

    mock_client_instance = MagicMock()
    mock_genai.Client.return_value = mock_client_instance
    mock_response = MagicMock()

    mock_response.text = "This is not json."
    mock_client_instance.models.generate_content.return_value = mock_response

    with pytest.raises(json.JSONDecodeError):
        generate_schedule("2023-10-02", "2023-10-08")

def test_invalid_date_in_goals(mock_get_setting, mock_get_db, mock_genai):
    # Test that a goal with an invalid start_date doesn't crash the loop
    mock_get_setting.side_effect = lambda key, default=None: "dummy_key" if key == "gemini_api_key" else default

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value.__enter__.return_value = mock_conn

    mock_cursor.fetchall.side_effect = [
        [], # commitments
        [{"id": "g1", "title": "Goal 1", "target_per_week": 5, "start_date": "INVALID_DATE"}], # goals
        [], # projects
        [], # work_shifts
        [], # sleep_schedules
        [], # exemptions
        []  # trips
    ]

    mock_client_instance = MagicMock()
    mock_genai.Client.return_value = mock_client_instance
    mock_response = MagicMock()

    expected_schedule = {"days": {}, "warnings": []}
    mock_response.text = json.dumps(expected_schedule)
    mock_client_instance.models.generate_content.return_value = mock_response

    schedule = generate_schedule("2023-10-02", "2023-10-08")
    assert schedule == expected_schedule

    # Goal should still be in the prompt with original target_per_week
    prompt = mock_client_instance.models.generate_content.call_args[1]['contents']
    assert "Goal 1" in prompt
    assert '"target_per_week": 5' in prompt


def test_generate_schedule_with_markdown_ticks(mock_get_setting, mock_get_db, mock_genai):
    mock_get_setting.side_effect = lambda key, default=None: "dummy_key" if key == "gemini_api_key" else default

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value.__enter__.return_value = mock_conn

    # 1. commitments
    # 2. goals
    # 3. projects
    # 4. work_shifts
    # 5. sleep_schedules
    # 6. exemptions
    # 7. overlapping_trips
    mock_cursor.fetchall.side_effect = [
        [], [], [], [], [], [], []
    ]

    mock_client_instance = MagicMock()
    mock_genai.Client.return_value = mock_client_instance
    mock_response = MagicMock()

    expected_schedule = {"days": {}, "warnings": []}
    mock_response.text = f"```\n{json.dumps(expected_schedule)}\n```"
    mock_client_instance.models.generate_content.return_value = mock_response

    schedule = generate_schedule("2023-10-02", "2023-10-08")
    assert schedule == expected_schedule


def test_generate_schedule_with_ramp_up(mock_get_setting, mock_get_db, mock_genai):
    mock_get_setting.side_effect = lambda key, default=None: "dummy_key" if key == "gemini_api_key" else default

    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_get_db.return_value.__enter__.return_value = mock_conn

    # 1. commitments
    # 2. goals
    # 3. projects
    # 4. work_shifts
    # 5. sleep_schedules
    # 6. exemptions
    # 7. overlapping_trips

    # Goal started exactly 2 weeks ago (2023-09-18). Target is 5.
    # Ramp offset is 1.
    # weeks_since_start = (2023-10-02 - 2023-09-18) = 14 days // 7 = 2
    # effective_week = max(1, 2 - 1 + 1) = 2
    # New target should be min(2, 5) = 2
    mock_cursor.fetchall.side_effect = [
        [], # commitments
        [{"id": "g1", "title": "Goal 1", "target_per_week": 5, "start_date": "2023-09-18", "ramp_offset": 1}], # goals
        [], # projects
        [], # work_shifts
        [], # sleep_schedules
        [], # exemptions
        []  # trips
    ]

    mock_client_instance = MagicMock()
    mock_genai.Client.return_value = mock_client_instance
    mock_response = MagicMock()

    expected_schedule = {"days": {}, "warnings": []}
    mock_response.text = json.dumps(expected_schedule)
    mock_client_instance.models.generate_content.return_value = mock_response

    schedule = generate_schedule("2023-10-02", "2023-10-08")
    assert schedule == expected_schedule

    prompt = mock_client_instance.models.generate_content.call_args[1]['contents']
    assert "Goal 1" in prompt
    assert '"target_per_week": 2' in prompt
