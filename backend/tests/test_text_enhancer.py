from backend.text_enhancer import _final_polish

def test_final_polish_capitalization():
    # Sentences start with capital letters
    assert _final_polish("hello world. how are you?") == "Hello world. How are you?"

    # Capitalize first character
    assert _final_polish("this is a test") == "This is a test"

def test_final_polish_spacing():
    # Double spaces
    assert _final_polish("This  is   a    test") == "This is a test"

    # Space before punctuation
    assert _final_polish("Hello , world ! How are you ?") == "Hello, world! How are you?"

    # Space after punctuation
    assert _final_polish("Hello,world!How are you?") == "Hello, world! How are you?"

def test_final_polish_other():
    # Multiple periods
    assert _final_polish("Hello world...") == "Hello world."

    # Capitalize pronoun i
    assert _final_polish("you and i should go.") == "You and I should go."

    # Trimming
    assert _final_polish("  Hello world  \n  test  ") == "Hello world\ntest"
