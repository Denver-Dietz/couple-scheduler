## 2024-05-14 - Pytest ModuleNotFoundError
**Learning:** Pytest might fail with `ModuleNotFoundError` when the module is being imported relative to the current working directory but executed via `python3 -m pytest <file>` if `PYTHONPATH` isn't set, or if the test script does not use absolute imports from the base package (e.g., `from backend.text_enhancer` instead of `from text_enhancer`).
**Action:** Use absolute imports for modules within the repository (e.g. `from backend.module import function`) in the test files and run tests from the root directory with `PYTHONPATH=. python3 -m pytest <path>`.

## 2024-05-14 - Python Cache files in version control
**Learning:** Compiled Python cache files (`__pycache__`, `*.pyc`) should not be added to version control. They cause bloat, unnecessary merge conflicts, and are tied to specific Python versions.
**Action:** Always make sure `.gitignore` contains `__pycache__/` and `*.pyc` rules and verify `git status` output before creating a commit. If any binary files were staged, use `git rm -rf --cached <file>` to unstage them.
