import pytest
from backend.text_enhancer import _local_spelling_fix

def test_local_spelling_fix():
    # Happy path: typical misspellings
    assert _local_spelling_fix("I gotta go") == "I got to go"
    assert _local_spelling_fix("ngl this is kinda cool") == "not going to lie this is kind of cool"

    # Capitalization preservation
    assert _local_spelling_fix("Rn we are busy") == "Right now we are busy"
    assert _local_spelling_fix("Wanna play?") == "Want to play?"

    # Boundary tests (don't replace inside other words)
    assert _local_spelling_fix("canteen") == "canteen" # 'cant' should not be replaced here
    assert _local_spelling_fix("Summertime") == "Summertime" # 'sum' should not be replaced

    # Multiple replacements
    assert _local_spelling_fix("cuz im tired tho") == "because I'm tired though"

    # No changes needed
    assert _local_spelling_fix("This is perfect as it is.") == "This is perfect as it is."

    # Edge cases
    assert _local_spelling_fix("") == ""
    assert _local_spelling_fix("   rn   ") == "   right now   "
