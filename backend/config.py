"""
Configuration helpers.

Why:
- Wraps direct database calls to provide a unified interface for fetching sensitive environment
  variables that are dynamically configurable via the UI rather than static `.env` files.
"""

from backend.database import get_setting

def get_gemini_api_key():
    return get_setting("gemini_api_key")

def get_telegram_bot_token():
    return get_setting("telegram_bot_token")
