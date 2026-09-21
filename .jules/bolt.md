## 2026-09-21 - Do not commit __pycache__ files
**Learning:** Pytest execution generates __pycache__ folders that must not be checked into the repository as binary files. Sometimes `git rm --cached` isn't enough if they stay in the index or working tree and `git commit --amend` isn't careful.
**Action:** Before committing, always check `git status` or `git diff --cached` to make sure binary files and pycache directories aren't accidentally staged. Better yet, create or ensure a `.gitignore` exists at the root with `__pycache__/` in it.
