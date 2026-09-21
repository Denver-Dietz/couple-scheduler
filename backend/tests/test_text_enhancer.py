import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from text_enhancer import _improve_structure

def test_improve_structure_empty():
    assert _improve_structure("") == ""
    assert _improve_structure("   ") == "   "

def test_improve_structure_normal_sentence():
    assert _improve_structure("This is a simple sentence.") == "This is a simple sentence."

def test_improve_structure_run_on():
    # Should split according to phase 1 rules in _split_run_ons
    assert _improve_structure("This is a run-on sentence but I think it should split.") == "This is a run-on sentence. But I think it should split."

def test_improve_structure_multiple_paragraphs():
    text = "First paragraph.\n\nSecond paragraph."
    expected = "First paragraph.\n\nSecond paragraph."
    assert _improve_structure(text) == expected

    text2 = "First paragraph.\n\nSecond paragraph but I think it is long."
    expected2 = "First paragraph.\n\nSecond paragraph. But I think it is long."
    assert _improve_structure(text2) == expected2

def test_improve_structure_no_trailing_newline():
    text = "First paragraph\n\nSecond paragraph"
    expected = "First paragraph.\n\nSecond paragraph."
    assert _improve_structure(text) == expected
