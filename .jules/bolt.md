## 2024-10-06 - Avoid committing `__pycache__`
**Learning:** Running `pytest` generates `__pycache__` directories containing binary `.pyc` files. Staging all files indiscriminately stages these binary files, which is an anti-pattern.
**Action:** Explicitly stage modified files or use `git clean -fdX` to remove untracked generated files before committing. Avoid using `git add .` without checking the status first.
