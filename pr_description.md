🧪 Add tests for text_enhancer _final_polish

🎯 **What:** The `_final_polish` function in `backend/text_enhancer.py` lacked test coverage for its string formatting operations (capitalization, spacing, trimming).
📊 **Coverage:** The new `backend/tests/test_text_enhancer.py` file covers:
- Capitalizing the start of sentences and the first character of the string.
- Handling double spaces and spacing around punctuation.
- Converting multiple periods to a single one.
- Capitalizing the pronoun "i".
- Trimming overall leading and trailing whitespaces.
✨ **Result:** Test coverage for `_final_polish` is now comprehensive and regressions during refactoring can be confidently caught.
