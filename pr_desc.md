🧹 [code health improvement] Remove unused get_gemini_api_key

🎯 What:
Removed the unused function `get_gemini_api_key` from `backend/config.py`.

💡 Why:
Removing unused (dead) code prevents confusion for future developers and reduces the overall maintenance burden of the codebase.

✅ Verification:
- Ran a codebase-wide grep (`grep -rnw "backend" -e "get_gemini_api_key"`) to verify no other files import or call this function.
- Verified test suite and module load successfully (`PYTHONPATH=. python3 -c "import backend.config"`).

✨ Result:
Cleaner, more maintainable configuration file with no dead code.
