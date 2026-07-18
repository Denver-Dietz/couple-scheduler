import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

import_block = """from backend.database import init_db, get_db, set_setting, get_setting
from backend.bot import start_bot_async, stop_bot_async, bot_apps, send_message_sync
import asyncio
from datetime import datetime, timedelta

async def trip_memories_cron():
    while True:
        try:
            # Check for trips ending yesterday
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM trips WHERE end_date = ?", (yesterday,))
                trips = cursor.fetchall()
                
            for t in trips:
                dest = t['destination']
                link = f"http://localhost:5173/?tab=memories&upload=true&prefill_location={dest}"
                msg = f"Welcome back from {dest}! Tap to save your favorite moments:\\n{link}"
                # Send to both users
                u1_chat = get_setting('user1_telegram_chat_id')
                if u1_chat:
                    send_message_sync(u1_chat, msg)
                u2_chat = get_setting('user2_telegram_chat_id')
                if u2_chat:
                    send_message_sync(u2_chat, msg)
        except Exception as e:
            print("Trip cron error:", e)
        
        await asyncio.sleep(86400) # Sleep 24 hours
"""

lifespan_block = """async def lifespan(app: FastAPI):
    # Startup
    init_db()
    await start_bot_async(on_update=notify_frontend)
    asyncio.create_task(trip_memories_cron())
    yield
    # Shutdown
    await stop_bot_async()"""

# Replace imports
content = content.replace("from backend.database import init_db, get_db, set_setting, get_setting\nfrom backend.bot import start_bot_async, stop_bot_async, bot_apps", import_block)

# Replace lifespan
content = content.replace("async def lifespan(app: FastAPI):\n    # Startup\n    init_db()\n    await start_bot_async(on_update=notify_frontend)\n    yield\n    # Shutdown\n    await stop_bot_async()", lifespan_block)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected trip cron!")
