## 2023-10-25 - Python Datetime Fallback Behavior
**Learning:** `datetime.strptime("9:15", "%H:%M")` correctly parses strings missing leading zeros into '09:15', avoiding a ValueError.
**Action:** When testing or writing datetime parsing for `%H:%M`, account for this built-in forgiveness to avoid writing redundant fallback code.
