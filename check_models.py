import sqlite3
conn=sqlite3.connect('backend/scheduler.db')
key=conn.execute("SELECT value FROM settings WHERE key='gemini_api_key'").fetchone()[0]
from google import genai
client=genai.Client(api_key=key)
print([m.name for m in client.models.list() if 'flash' in m.name])
