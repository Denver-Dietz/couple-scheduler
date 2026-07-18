"""
Telegram Bot controller for the Couple Scheduler.
Handles natural language parsing via Gemini, routing commands to the database, and providing a mobile-friendly interface for all core features.
"""

import asyncio
import os
from telegram import Update, BotCommand
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from backend.database import get_setting, get_db
import logging
from google import genai
import json
import uuid
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bot_apps = []
bot_status = "stopped"  # "stopped", "starting", "running"
on_update_callback = None

def is_authorized(user_id: int, username: str) -> bool:
    """
    Validates if a Telegram user is permitted to interact with the bot.
    Prevents unauthorized external users from manipulating the couple's private schedule and data.
    
    Args:
        user_id (int): Telegram's internal numeric user ID.
        username (str): The user's public Telegram handle.
        
    Returns:
        bool: True if authorized or if the whitelist is empty (first-run scenario), False otherwise.
    """
    allowed = get_setting("authorized_users", default=[])
    if not allowed:
        return True
    if isinstance(allowed, str):
        allowed = [a.strip() for a in allowed.split(",") if a.strip()]
    allowed_str = [str(a) for a in allowed]
    return str(user_id) in allowed_str or (username and username in allowed_str)

def get_gemini_client():
    """
    Initializes the Gemini AI client using the stored global setting.
    Abstracted here so commands fail gracefully if the user hasn't configured their API key yet.
    
    Returns:
        genai.Client | None: The configured client, or None if missing.
    """
    api_key = get_setting("gemini_api_key")
    if not api_key:
        return None
    return genai.Client(api_key=api_key)


def format_time_ampm(time_str):
    if not time_str:
        return 'TBD'
    if time_str == 'off':
        return 'Off'
    try:
        dt = datetime.fromisoformat(time_str)
        return dt.strftime("%b %d, %I:%M %p")
    except ValueError:
        pass
    try:
        t = datetime.strptime(time_str, "%H:%M")
        return t.strftime("%I:%M %p").lstrip('0')
    except ValueError:
        pass
    try:
        t = datetime.strptime(time_str, "%H:%M:%S")
        return t.strftime("%I:%M %p").lstrip('0')
    except ValueError:
        pass
    return time_str


chat_histories = {}
CHAT_TIMEOUT_HOURS = 2

async def gemini_generate(client, prompt, user_id="system", max_retries=3):
    """
    Wrapper for Gemini generation that handles multi-turn chat sessions and automatic retry on 503 Service Unavailable errors.
    Maintaining a chat session per user allows the LLM to understand conversational context (e.g. "change that to Friday").
    
    Args:
        client: The genai.Client instance.
        prompt (str): The natural language query.
        user_id (str): Unique identifier for the user session.
        max_retries (int): Retry limit for transient API failures.
        
    Returns:
        response: The generated AI response object.
    """
    now = datetime.now()
    
    # Cleanup expired sessions
    expired_users = [uid for uid, data in chat_histories.items() if now - data['last_active'] > timedelta(hours=CHAT_TIMEOUT_HOURS)]
    for uid in expired_users:
        del chat_histories[uid]

    if user_id not in chat_histories:
        chat = client.aio.chats.create(
            model='gemini-3.5-flash',
            config=genai.types.GenerateContentConfig()
        )
        chat_histories[user_id] = {'chat': chat, 'last_active': now}
    
    chat_histories[user_id]['last_active'] = now
    chat = chat_histories[user_id]['chat']

    for attempt in range(max_retries):
        try:
            response = await chat.send_message(prompt)
            return response
        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                wait = (attempt + 1) * 1.0  # 1s, 2s, 3s
                logger.warning(f"Gemini 503, retrying in {wait}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait)
            else:
                raise


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        await update.message.reply_text("You are not authorized to use this bot.")
        return
        
    help_text = (
        f"Hi {user.first_name}! \U0001F44B I'm your Couple Scheduler bot.\n"
        f"Assigned to profile: {context.bot_data.get('user_id', 'unknown')}\n\n"
        "\U0001F4DD **Commands Reference:**\n\n"
        "/work <day> <start>-<end> \u2014 Set a work shift\n"
        "  _e.g. /work Monday 9am-5pm_\n"
        "/work off <day> \u2014 Mark a day off\n"
        "/work list \u2014 Show upcoming shifts\n\n"
        "/sleep <time> <days> \u2014 Set sleep hours\n"
        "  _e.g. /sleep 10pm-6am on weekdays_\n"
        "/sleep list \u2014 Show sleep schedules\n\n"
        "/appointment <desc> \u2014 Add a fixed event\n"
        "  _e.g. /appointment Dentist Fri 2pm_\n\n"
        "/goal <desc> \u2014 Add a flexible habit\n"
        "  _e.g. /goal Gym 3x a week for 45m_\n\n"
        "/project <desc> \u2014 Add a project\n"
        "  _e.g. /project Build shed 4 hours_\n\n"
        "/idea <desc> \u2014 Add a date idea (Bucket List)\n"
        "  _e.g. /idea Try the new sushi place downtown_\n\n"
        "/trip <dest/url> \u2014 Add a Dream Board destination\n"
        "  _e.g. /trip Tokyo_\n\n"
        "/peek \u2014 View your partner's items/shifts\n"
        "/today \u2014 View today's generated schedule\n"
        "/week \u2014 View the week's generated schedule\n"
        "/list \u2014 List all your items\n"
        "/generate \u2014 Optimize the schedule\n"
        "/reset \u2014 Clear the bot's conversation history\n\n"
        "\U0001F4F8 **Memories**: Send a photo with a caption to add it to your dashboard!\n"
        "Or just type naturally! (e.g. 'We should go to Paris someday')"
    )
    await update.message.reply_text(help_text, parse_mode='Markdown')

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await cmd_start(update, context)

async def cmd_appointment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return

    text = " ".join(context.args) if context.args else ""
    if not text:
        await update.message.reply_text("Please describe the appointment.\ne.g. /appointment Dentist Friday at 2pm for 1 hour")
        return

    client = get_gemini_client()
    if not client:
        await update.message.reply_text("⚠️ Gemini API Key not configured.")
        return

    try:
        now = datetime.now()
        prompt = f"""You are a scheduling assistant. Parse this appointment description into JSON.
Current date/time: {now.strftime('%Y-%m-%d %H:%M %A')}
User input: \"{text}\"

Return ONLY valid JSON (no markdown) with this schema:
{{
  "appointments": [
    {{
      "title": "string",
      "start_time": "ISO8601 datetime string",
      "end_time": "ISO8601 datetime string"
    }}
  ]
}}
If the user specifies a recurring pattern (e.g. 'every Wednesday at 4pm for 30 minutes for the next 6 weeks'), generate all individual dates in the appointments list.
If no duration is specified, assume 1 hour. Resolve relative dates based on the current date."""

        response = await gemini_generate(client, prompt, user_id=str(user.id))
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)

        user_profile_id = context.bot_data.get("user_id", "user1")
        user_name = get_setting(f"{user_profile_id}_name", default="User 1" if user_profile_id == "user1" else "User 2")
        appointments = parsed.get("appointments", [])
        
        if not appointments:
            await update.message.reply_text("❌ No appointments could be parsed.")
            return

        with get_db() as conn:
            for apt in appointments:
                item_id = str(uuid.uuid4())
                conn.execute(
                    "INSERT INTO commitments (id, user_id, title, start_time, end_time, raw_text) VALUES (?, ?, ?, ?, ?, ?)",
                    (item_id, user_profile_id, apt["title"], apt.get("start_time"), apt.get("end_time"), text)
                )
            conn.commit()

        if on_update_callback:
            on_update_callback()

        await update.message.reply_text(f"✅ Added {len(appointments)} appointments for {user_name}!")
    except Exception as e:
        await update.message.reply_text(f"❌ Could not parse. Error: {e}")

async def cmd_goal(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return

    text = " ".join(context.args) if context.args else ""
    if not text:
        await update.message.reply_text("Please describe the goal.\ne.g. /goal Workout 3 times a week for 45 minutes")
        return

    client = get_gemini_client()
    if not client:
        return

    try:
        now = datetime.now()
        prompt = f"""You are a scheduling assistant. Parse this goal description into JSON.
Current date: {now.strftime('%Y-%m-%d %A')}
User input: \"{text}\"

Return ONLY valid JSON (no markdown) with this schema:
{{
  "title": "string",
  "duration_minutes": integer,
  "target_per_week": integer,
  "preferred_time_of_day": "morning|afternoon|evening|any",
  "start_date": "YYYY-MM-DD"
}}
If duration is not specified, assume 60 minutes.
If frequency is not specified, assume 3 times per week.
If time preference is not specified, use "any".
If a specific start date or timeframe is mentioned, set start_date. Otherwise, set it to the current date."""

        response = await gemini_generate(client, prompt, user_id=str(user.id))
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)

        item_id = str(uuid.uuid4())
        user_profile_id = context.bot_data.get("user_id", "user1")
        user_name = get_setting(f"{user_profile_id}_name", default="User 1" if user_profile_id == "user1" else "User 2")
        start_date = parsed.get("start_date") or now.strftime('%Y-%m-%d')
        with get_db() as conn:
            conn.execute(
                "INSERT INTO goals (id, title, duration_minutes, target_per_week, preferred_time_of_day, user_id, start_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (item_id, parsed["title"], parsed.get("duration_minutes", 60), parsed.get("target_per_week", 3), parsed.get("preferred_time_of_day", "any"), user_profile_id, start_date)
            )
            conn.commit()

        if on_update_callback:
            on_update_callback()

        await update.message.reply_text(f"✅ Goal added for {user_name}!\n\n🎯 {parsed['title']}")
    except Exception as e:
        await update.message.reply_text(f"❌ Could not parse. Error: {e}")

async def cmd_project(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return

    text = " ".join(context.args) if context.args else ""
    if not text:
        await update.message.reply_text("Please describe the project.\ne.g. /project Build garden shed 4 hours deadline August 1")
        return

    client = get_gemini_client()
    if not client:
        return

    try:
        now = datetime.now()
        prompt = f"""You are a scheduling assistant. Parse this project description into JSON.
Current date: {now.strftime('%Y-%m-%d')}
User input: \"{text}\"

The input describes a project and may be phrased in several ways:
- "<activity> <time frame> <expected number of hours>" (e.g., "Mow lawn next 2 week 2 hours max")
- "<activity> in the <time frame> expect <expected number of hours>" (e.g., "Mow lawn in the next 2 week expect 2 hours max")
- "<activity> within <time frame>, should take <expected number of hours>" (e.g., "Paint fence within 3 days, should take 4 hours")
- Any similar phrasing expressing the task title, a deadline/timeframe, and expected/maximum allocation of hours.

Return ONLY valid JSON (no markdown) with this schema:
{{
  "title": "string (the activity name, e.g. Mow lawn)",
  "total_hours": number (the expected number of hours, e.g. 2.0. Parse '2 hours max', 'should take 4 hours', or similar phrases to a decimal/integer)",
  "start_date": "YYYY-MM-DD (start of the timeframe. You MUST calculate this date. If not specified, default to today's date)",
  "deadline": "YYYY-MM-DD (end of the timeframe. You MUST calculate this date based on the timeframe, e.g. if today is 2026-07-14 and the timeframe is 'next 2 week', this must be '2026-07-28'. Never leave this field null or empty if a timeframe or period is specified)"
}}
Resolve relative timeframes and deadlines based on the current date. Ensure "deadline" is ALWAYS calculated and never null if the user specifies a timeframe like "next 2 week" or "in 2 weeks"."""

        response = await gemini_generate(client, prompt, user_id=str(user.id))
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)

        item_id = str(uuid.uuid4())
        user_profile_id = context.bot_data.get("user_id", "user1")
        user_name = get_setting(f"{user_profile_id}_name", default="User 1" if user_profile_id == "user1" else "User 2")
        start_date = parsed.get("start_date") or now.strftime('%Y-%m-%d')
        with get_db() as conn:
            conn.execute(
                "INSERT INTO projects (id, title, total_hours, start_date, deadline, user_id) VALUES (?, ?, ?, ?, ?, ?)",
                (item_id, parsed["title"], parsed.get("total_hours", 4), start_date, parsed.get("deadline"), user_profile_id)
            )
            conn.commit()

        if on_update_callback:
            on_update_callback()

        await update.message.reply_text(f"✅ Project added for {user_name}!\n\n💼 {parsed['title']}")
    except Exception as e:
        await update.message.reply_text(f"❌ Could not parse. Error: {e}")


async def cmd_today(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return

    today = datetime.now().strftime('%Y-%m-%d')
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT schedule_json FROM schedules ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        
        cursor.execute("SELECT key, value FROM settings WHERE key IN ('user1_name', 'user2_name')")
        settings_dict = dict(cursor.fetchall())
        u1_name = settings_dict.get('user1_name', 'User 1')
        u2_name = settings_dict.get('user2_name', 'User 2')

    if not row:
        await update.message.reply_text("No schedule generated yet. Use /generate to create one!")
        return

    schedule = json.loads(row["schedule_json"])
    days = schedule.get("days", {})
    today_slots = days.get(today, [])

    if not today_slots:
        await update.message.reply_text(f"\U0001F4C5 No events scheduled for today ({today}).")
        return

    lines = [f"\U0001F4C5 Today's Schedule ({today})\n"]
    for slot in today_slots:
        emoji = {"sleep": "\U0001F634", "work": "\U0001F4BC", "commitment": "\U0001F4CC", "goal": "\U0001F3AF", "project": "\U0001F6E0", "free": "\u2615"}.get(slot.get("type"), "\u2022")
        slot_uid = slot.get('user_id', 'both')
        who_name = 'Both' if slot_uid == 'both' else (u1_name if slot_uid == 'user1' else (u2_name if slot_uid == 'user2' else slot_uid))
        who = f"[{who_name}]"
        lines.append(f"{who} {emoji} {slot['start_time']} \u2013 {slot['end_time']}  {slot['title']}")

    await update.message.reply_text("\n".join(lines))


async def cmd_week(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT schedule_json FROM schedules ORDER BY created_at DESC LIMIT 1")
        row = cursor.fetchone()
        
        cursor.execute("SELECT key, value FROM settings WHERE key IN ('user1_name', 'user2_name')")
        settings_dict = dict(cursor.fetchall())
        u1_name = settings_dict.get('user1_name', 'User 1')
        u2_name = settings_dict.get('user2_name', 'User 2')

    if not row:
        await update.message.reply_text("No schedule generated yet. Use /generate to create one!")
        return

    schedule = json.loads(row["schedule_json"])
    days = schedule.get("days", {})
    sorted_dates = sorted(days.keys())

    if not sorted_dates:
        await update.message.reply_text("Schedule is empty.")
        return

    lines = ["\U0001F5D3 Weekly Schedule\n"]
    for date in sorted_dates:
        try:
            dt = datetime.strptime(date, '%Y-%m-%d')
            day_name = dt.strftime('%A %b %d')
        except:
            day_name = date
        slots = days[date]
        non_sleep = [s for s in slots if s.get('type') not in ('sleep',)]
        lines.append(f"\U0001F4C6 {day_name}")
        if non_sleep:
            for slot in non_sleep:
                emoji = {"work": "\U0001F4BC", "commitment": "\U0001F4CC", "goal": "\U0001F3AF", "project": "\U0001F6E0", "free": "\u2615"}.get(slot.get("type"), "\u2022")
                slot_uid = slot.get('user_id', 'both')
                who_name = 'Both' if slot_uid == 'both' else (u1_name if slot_uid == 'user1' else (u2_name if slot_uid == 'user2' else slot_uid))
                who = f"[{who_name}]"
                lines.append(f"  {who} {emoji} {slot['start_time']}\u2013{slot['end_time']} {slot['title']}")
        else:
            lines.append("  \u2615 Free day")
        lines.append("")

    await update.message.reply_text("\n".join(lines))


from telegram import Update, BotCommand, InlineKeyboardButton, InlineKeyboardMarkup

async def execute_generate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await context.bot.send_message(chat_id=update.effective_chat.id, text="\u2699\uFE0F Generating dual-user optimized schedule... This may take a moment.")
    try:
        from backend.scheduler import generate_schedule
        now = datetime.now()
        monday = now - timedelta(days=now.weekday())
        sunday = monday + timedelta(days=6)
        schedule = generate_schedule(monday.strftime('%Y-%m-%d'), sunday.strftime('%Y-%m-%d'))
        
        if on_update_callback:
            on_update_callback()
        
        days = schedule.get("days", {})
        total_events = sum(len(v) for v in days.values())
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=f"\u2705 Schedule generated!\n\n"
                 f"\U0001F4CA {total_events} time blocks scheduled\n\n"
                 f"Use /today or /week to view it!"
        )
    except Exception as e:
        logger.error(f"Error in /generate: {e}")
        await context.bot.send_message(chat_id=update.effective_chat.id, text=f"\u274C Schedule generation failed.\nError: {e}")

async def ask_next_ramp_goal(update: Update, context: ContextTypes.DEFAULT_TYPE):
    ramping_goals = context.user_data.get("ramping_goals", [])
    if not ramping_goals:
        # Done asking, run generation
        await execute_generate(update, context)
        return
        
    goal = ramping_goals.pop(0)
    context.user_data["ramping_goals"] = ramping_goals
    context.user_data["current_prompt_goal_id"] = goal["id"]
    
    keyboard = [
        [
            InlineKeyboardButton("Yes, continue", callback_data=f"ramp_yes"),
            InlineKeyboardButton(f"Keep at {goal['effective_target']}", callback_data=f"ramp_no")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    text = f"Goal: {goal['title']}\nTarget: {goal['target_per_week']}/week\nYou are currently at {goal['effective_target']}/week.\nDo you want to continue the ramp up this week?"
    
    if update.callback_query:
        await update.callback_query.edit_message_text(text=text, reply_markup=reply_markup)
    else:
        await update.message.reply_text(text=text, reply_markup=reply_markup)

async def cmd_generate(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return

    # Check for ramping goals
    user_profile_id = context.bot_data.get("user_id", "user1")
    now = datetime.now()
    schedule_start_dt = now - timedelta(days=now.weekday())
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM goals WHERE user_id=?", (user_profile_id,))
        goals = cursor.fetchall()
        
    ramping_goals = []
    for g in goals:
        if not g["start_date"]: continue
        try:
            goal_start_dt = datetime.strptime(g["start_date"], "%Y-%m-%d")
            weeks_since_start = max(0, (schedule_start_dt - goal_start_dt).days // 7)
            ramp_offset = g["ramp_offset"] or 0
            effective_week = max(1, weeks_since_start - ramp_offset + 1)
            
            # If it hasn't reached the final target yet, and it's actually ramping up this week
            # For it to ramp up this week, effective_week must be > 1 and <= target_per_week
            # Actually, just prompt if effective_week < target_per_week
            if effective_week < g["target_per_week"]:
                ramping_goals.append({
                    "id": g["id"],
                    "title": g["title"],
                    "target_per_week": g["target_per_week"],
                    "effective_target": effective_week
                })
        except: pass
        
    if ramping_goals:
        context.user_data["ramping_goals"] = ramping_goals
        await ask_next_ramp_goal(update, context)
    else:
        await execute_generate(update, context)

async def handle_callback_query(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data
    if data in ("ramp_yes", "ramp_no"):
        goal_id = context.user_data.get("current_prompt_goal_id")
        if data == "ramp_no" and goal_id:
            # Increment ramp_offset
            with get_db() as conn:
                conn.execute("UPDATE goals SET ramp_offset = ramp_offset + 1 WHERE id=?", (goal_id,))
                conn.commit()
                
        await ask_next_ramp_goal(update, context)

    # Journal Read Callback
    elif data.startswith("read_journal_"):
        entry_id = data.split("read_journal_")[1]
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT content, created_at FROM journal_entries WHERE id=?", (entry_id,))
            entry = cursor.fetchone()
        
        if entry:
            dt = datetime.strptime(entry["created_at"], "%Y-%m-%d %H:%M:%S")
            formatted_date = dt.strftime("%A, %b %d at %I:%M %p")
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text=f"\U0001F4D6 Journal Entry ({formatted_date}):\n\n{entry['content']}"
            )
        else:
            await context.bot.send_message(
                chat_id=update.effective_chat.id,
                text="\u274C Journal entry not found."
            )

    # Journal AI Edit Callback
    elif data in ("journal_edit_yes", "journal_edit_no"):
        draft = context.user_data.get("journal_draft")
        if not draft:
            await update.callback_query.edit_message_text("\u274C Draft expired or not found.")
            return
            
        user_profile_id = context.bot_data.get("user_id", "user1")
        text_to_post = draft
        
        if data == "journal_edit_yes":
            await update.callback_query.edit_message_text("\u2728 Enhancing your entry...")
            try:
                from backend.text_enhancer import enhance_text
                text_to_post = await enhance_text(draft)
            except Exception as e:
                logger.error(f"Text enhancement failed in bot: {e}")
                await context.bot.send_message(chat_id=update.effective_chat.id, text="\u26A0\uFE0F Enhancement unavailable right now. Posting original.")
        
        # Save to DB
        entry_id = str(uuid.uuid4())
        with get_db() as conn:
            conn.execute("INSERT INTO journal_entries (id, user_id, content) VALUES (?, ?, ?)",
                (entry_id, user_profile_id, text_to_post))
            conn.commit()
            
        if on_update_callback:
            on_update_callback()
            
        context.user_data.pop("journal_draft", None)
        user_name = get_setting(f"{user_profile_id}_name", default="User 1" if user_profile_id == "user1" else "User 2")
        await update.callback_query.edit_message_text(f"✅ Journal entry saved for {user_name}!\n\n{text_to_post}")


async def cmd_list(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return
    user_profile_id = context.bot_data.get("user_id", "user1")
    user_name = get_setting(f"{user_profile_id}_name", default="User 1" if user_profile_id == "user1" else "User 2")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT title, start_time FROM commitments WHERE user_id=? ORDER BY start_time", (user_profile_id,))
        commitments = cursor.fetchall()
        cursor.execute("SELECT title, duration_minutes, target_per_week FROM goals WHERE user_id=?", (user_profile_id,))
        goals = cursor.fetchall()
        cursor.execute("SELECT title, total_hours, deadline FROM projects WHERE user_id=?", (user_profile_id,))
        projects = cursor.fetchall()

    lines = [f"Items for {user_name}:"]
    lines.append("📌 Appointments")
    for c in commitments: lines.append(f"  • {c['title']} ({format_time_ampm(c['start_time'])})")
    lines.append("🎯 Goals")
    for g in goals: lines.append(f"  • {g['title']}")
    lines.append("💼 Projects")
    for p in projects: lines.append(f"  • {p['title']}")

    await update.message.reply_text("\n".join(lines))


async def handle_free_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return

    text = update.message.text
    client = get_gemini_client()
    if not client:
        return

    try:
        now = datetime.now()
        prompt = f"""You are a scheduling assistant parsing a natural language message.
Current date/time: {now.strftime('%Y-%m-%d %H:%M %A')}
User message: \"{text}\"

Determine what type of scheduling item this is.
If the user wants to adjust/override the ramp-up of an existing goal (e.g. "keep my gym goal at 2 this week"), return type "goal_override" and set "override_target" to the new weekly target for this week.
Return ONLY valid JSON (no markdown) with this schema:
{{
  "type": "commitment" or "goal" or "project" or "goal_override" or "bucket_list_activity" or "bucket_list_destination",
  "effort_level": "string ('1', '2', or '3') (only for bucket_list_activity)",
  "estimated_cost": "string ('1', '2', or '3') (only for bucket_list_activity)",
  "title": "string (the name of the goal/project/commitment. For project, e.g. 'Mow lawn')",
  "appointments": [
    {{
      "start_time": "ISO8601 datetime string",
      "end_time": "ISO8601 datetime string"
    }}
  ],
  "duration_minutes": integer (only for goal),
  "target_per_week": integer (only for goal),
  "start_date": "YYYY-MM-DD (for goal or project. For project, default to today's date if not specified. You MUST calculate this date)",
  "total_hours": number (only for project. Parse expected hours, e.g. 2.0 from '2 hours max' or similar phrases)",
  "deadline": "YYYY-MM-DD (only for project. You MUST calculate this date based on the timeframe, e.g. if today is 2026-07-14 and the timeframe is 'next 2 week', this must be '2026-07-28'. Never leave this field null or empty if a timeframe or period is specified)",
  "override_target": integer (only for goal_override)
}}
For type "commitment", if the user specifies a recurring pattern (e.g. 'every Wednesday for 6 weeks'), generate all individual dates in the "appointments" array. Otherwise, generate a single appointment in the array.
For type "project", the input may be phrased in several ways:
- "<activity> <time frame> <expected number of hours>" (e.g. "Mow lawn next 2 week 2 hours max")
- "<activity> in the <time frame> expect <expected number of hours>" (e.g., "Mow lawn in the next 2 week expect 2 hours max")
- "<activity> within <time frame>, should take <expected number of hours>" (e.g., "Paint fence within 3 days, should take 4 hours")
- Any similar phrasing expressing the task title, a deadline/timeframe, and expected/maximum allocation of hours. Resolve relative dates from today."""

        response = await gemini_generate(client, prompt, user_id=str(user.id))
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)

        item_id = str(uuid.uuid4())
        item_type = parsed.get("type", "commitment")
        user_profile_id = context.bot_data.get("user_id", "user1")
        start_date = parsed.get("start_date") or now.strftime('%Y-%m-%d')

        with get_db() as conn:
            if item_type == "commitment":
                appointments = parsed.get("appointments", [])
                for apt in appointments:
                    conn.execute("INSERT INTO commitments (id, user_id, title, start_time, end_time, raw_text) VALUES (?, ?, ?, ?, ?, ?)",
                        (str(uuid.uuid4()), user_profile_id, parsed["title"], apt.get("start_time"), apt.get("end_time"), text))
            elif item_type == "goal":
                conn.execute("INSERT INTO goals (id, title, duration_minutes, target_per_week, preferred_time_of_day, user_id, start_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (item_id, parsed["title"], parsed.get("duration_minutes", 60), parsed.get("target_per_week", 3), "any", user_profile_id, start_date))
            elif item_type == "project":
                conn.execute("INSERT INTO projects (id, title, total_hours, start_date, deadline, user_id) VALUES (?, ?, ?, ?, ?, ?)",
                    (item_id, parsed["title"], parsed.get("total_hours", 4), start_date, parsed.get("deadline"), user_profile_id))
            elif item_type == "goal_override":
                # Find the goal by fuzzy matching the title and increase its ramp_offset
                # Simplified approach: update the ramp_offset of the closest goal.
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM goals WHERE user_id=? AND title LIKE ?", (user_profile_id, f"%{parsed['title']}%"))
                row = cursor.fetchone()
                if row:
                    # Increment ramp_offset so that weeks_since_start - ramp_offset is lower
                    # A more exact approach is handled in scheduler, but bumping offset by 1 is a simple "pause for a week".
                    conn.execute("UPDATE goals SET ramp_offset = ramp_offset + 1 WHERE id=?", (row['id'],))
            conn.commit()

        if on_update_callback:
            on_update_callback()

        if item_type == "goal_override":
            await update.message.reply_text(f"\u2705 Paused/overrode ramp-up for goal: {parsed['title']}")
        else:
            user_name = get_setting(f"{user_profile_id}_name", default="User 1" if user_profile_id == "user1" else "User 2")
            await update.message.reply_text(f"✅ {item_type.capitalize()} added for {user_name}: {parsed['title']}")
    except Exception as e:
        await update.message.reply_text("\u2753 Couldn't understand. Use /appointment, /goal, or /project.")


async def cmd_work(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return
    user_profile_id = context.bot_data.get("user_id", "user1")

    text = " ".join(context.args) if context.args else ""
    if not text:
        await update.message.reply_text(
            "Please specify the shift.\n"
            "Examples:\n"
            "/work Monday 9am-5pm\n"
            "/work off Friday\n"
            "/work list"
        )
        return

    if text.lower().strip() == "list":
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT date, start_time, end_time, label FROM work_shifts WHERE user_id=? ORDER BY date, start_time", (user_profile_id,))
            shifts = cursor.fetchall()
        if not shifts:
            await update.message.reply_text("No specific work shifts scheduled.")
            return
        lines = ["\U0001F4BC Your Upcoming Work Shifts:"]
        for s in shifts:
            if s['start_time'] == 'off':
                lines.append(f"\u2022 {s['date']}: Off")
            else:
                lines.append(f"\u2022 {s['date']}: {format_time_ampm(s['start_time'])}-{format_time_ampm(s['end_time'])} {s['label'] or ''}")
        await update.message.reply_text("\n".join(lines))
        return

    client = get_gemini_client()
    if not client:
        return

    try:
        now = datetime.now()
        prompt = f"""You are parsing a work shift description.
Current date: {now.strftime('%Y-%m-%d %A')}
User input: \"{text}\"

Return ONLY valid JSON (no markdown) with this schema:
{{
  "date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "is_off": boolean,
  "label": "string (optional description)"
}}
Resolve relative days (e.g., "Monday") to the next occurring date, or today if it's today.
If "off", set start_time and end_time to "". """

        response = await gemini_generate(client, prompt, user_id=str(user.id))
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)

        shift_id = str(uuid.uuid4())
        
        with get_db() as conn:
            if parsed.get("is_off"):
                conn.execute(
                    "INSERT INTO work_shifts (id, user_id, date, start_time, end_time, label) VALUES (?, ?, ?, ?, ?, ?)",
                    (shift_id, user_profile_id, parsed["date"], "off", "off", parsed.get("label", "Day Off"))
                )
                msg = f"\u2705 Marked {parsed['date']} as Off."
            else:
                conn.execute(
                    "INSERT INTO work_shifts (id, user_id, date, start_time, end_time, label) VALUES (?, ?, ?, ?, ?, ?)",
                    (shift_id, user_profile_id, parsed["date"], parsed["start_time"], parsed["end_time"], parsed.get("label", ""))
                )
                msg = f"\u2705 Added shift on {parsed['date']}: {parsed['start_time']}-{parsed['end_time']}"
            conn.commit()

        if on_update_callback:
            on_update_callback()

        await update.message.reply_text(msg)
    except Exception as e:
        await update.message.reply_text(f"\u274C Could not parse. Error: {e}")


async def cmd_sleep(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return
    user_profile_id = context.bot_data.get("user_id", "user1")

    text = " ".join(context.args) if context.args else ""
    if not text:
        await update.message.reply_text(
            "Please specify your sleep schedule.\n"
            "Examples:\n"
            "/sleep 10pm-6am on weekdays\n"
            "/sleep 11pm-7am every day\n"
            "/sleep 12am-8am tonight\n"
            "/sleep list"
        )
        return

    if text.lower().strip() == "list":
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT schedule_type, schedule_value, start_time, end_time FROM sleep_schedules WHERE user_id=? ORDER BY created_at", (user_profile_id,))
            schedules = cursor.fetchall()
        if not schedules:
            await update.message.reply_text("No sleep schedules set.")
            return
        lines = ["\U0001F634 Your Sleep Schedules:"]
        for s in schedules:
            if s['schedule_type'] == 'specific_date':
                lines.append(f"\u2022 {s['schedule_value']}: {s['start_time']}-{s['end_time']}")
            elif s['schedule_type'] == 'weekly':
                lines.append(f"\u2022 Weekly ({s['schedule_value']}): {s['start_time']}-{s['end_time']}")
        await update.message.reply_text("\n".join(lines))
        return

    client = get_gemini_client()
    if not client:
        return

    try:
        now = datetime.now()
        prompt = f"""You are parsing a sleep schedule description.
Current date: {now.strftime('%Y-%m-%d %A')}
User input: \"{text}\"

Return ONLY valid JSON (no markdown) with this schema:
{{
  "schedule_type": "specific_date" or "weekly",
  "schedule_value": "YYYY-MM-DD" (if specific_date) OR a comma-separated list of days like "Monday,Tuesday" (if weekly),
  "start_time": "HH:MM",
  "end_time": "HH:MM"
}}
If the user says "every day", "daily", or doesn't specify days, assume it's weekly for "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday".
If the user says "weekdays", use "Monday,Tuesday,Wednesday,Thursday,Friday".
If the user says "weekends", use "Saturday,Sunday".
If they say "tonight" or a specific date/day, use specific_date. """

        response = await gemini_generate(client, prompt, user_id=str(user.id))
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(raw)

        shift_id = str(uuid.uuid4())
        
        with get_db() as conn:
            conn.execute(
                "INSERT INTO sleep_schedules (id, user_id, schedule_type, schedule_value, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)",
                (shift_id, user_profile_id, parsed["schedule_type"], parsed["schedule_value"], parsed["start_time"], parsed["end_time"])
            )
            conn.commit()

        if on_update_callback:
            on_update_callback()

        if parsed["schedule_type"] == "weekly":
            msg = f"\u2705 Added weekly sleep schedule for {parsed['schedule_value']}: {parsed['start_time']}-{parsed['end_time']}"
        else:
            msg = f"\u2705 Added sleep schedule for {parsed['schedule_value']}: {parsed['start_time']}-{parsed['end_time']}"

        await update.message.reply_text(msg)
    except Exception as e:
        await update.message.reply_text(f"\u274C Could not parse. Error: {e}")


async def cmd_reset(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return
        
    uid = str(user.id)
    if uid in chat_histories:
        del chat_histories[uid]
        await update.message.reply_text("\U0001F9F9 Conversation history cleared! I've forgotten our recent chat context and am ready for new instructions.")
    else:
        await update.message.reply_text("\U0001F9F9 No active conversation history to clear.")

async def cmd_journal(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return
        
    text = " ".join(context.args) if context.args else ""
    
    if not text:
        await update.message.reply_text("Please provide your journal entry.\ne.g. /journal Today was a great day!")
        return

    # Store draft in context and ask to enhance
    context.user_data["journal_draft"] = text
    
    keyboard = [
        [
            InlineKeyboardButton("\u2728 Yes, enhance it", callback_data="journal_edit_yes"),
            InlineKeyboardButton("No, post as is", callback_data="journal_edit_no")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Would you like the system to lightly edit your entry for spelling, grammar, and structure before posting?",
        reply_markup=reply_markup
    )

async def _read_latest_journal(update: Update, target_user: str):
    user_name = get_setting(f"{target_user}_name", default="User 1" if target_user == "user1" else "User 2")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT content, created_at FROM journal_entries WHERE user_id=? ORDER BY created_at DESC LIMIT 1", (target_user,))
        entry = cursor.fetchone()
        
    if entry:
        dt = datetime.strptime(entry["created_at"], "%Y-%m-%d %H:%M:%S")
        formatted_date = dt.strftime("%A, %b %d at %I:%M %p")
        await update.message.reply_text(f"📖 Latest Journal Entry by {user_name} ({formatted_date}):\n\n{entry['content']}")
    else:
        await update.message.reply_text(f"❌ No journal entries found for {user_name}.")

async def cmd_read_user1(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id, update.effective_user.username): return
    await _read_latest_journal(update, "user1")

async def cmd_read_user2(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id, update.effective_user.username): return
    await _read_latest_journal(update, "user2")

async def _list_journal(update: Update, target_user: str):
    user_name = get_setting(f"{target_user}_name", default="User 1" if target_user == "user1" else "User 2")
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, content, created_at FROM journal_entries WHERE user_id=? ORDER BY created_at DESC LIMIT 5", (target_user,))
        entries = cursor.fetchall()
        
    if not entries:
        await update.message.reply_text(f"No journal entries found for {user_name}.")
        return
        
    keyboard = []
    for entry in entries:
        dt = datetime.strptime(entry["created_at"], "%Y-%m-%d %H:%M:%S")
        formatted_date = dt.strftime("%b %d, %I:%M %p")
        preview = entry["content"][:30].replace('\n', ' ') + ('...' if len(entry["content"]) > 30 else '')
        button_text = f"{formatted_date} - {preview}"
        keyboard.append([InlineKeyboardButton(button_text, callback_data=f"read_journal_{entry['id']}")])
        
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(f"Last 5 journal entries by {user_name}:", reply_markup=reply_markup)

async def cmd_list_user1(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id, update.effective_user.username): return
    await _list_journal(update, "user1")

async def cmd_list_user2(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update.effective_user.id, update.effective_user.username): return
    await _list_journal(update, "user2")


async def cmd_peek(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return
    
    my_uid = context.bot_data.get("user_id", "user1")
    other_uid = "user2" if my_uid == "user1" else "user1"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key='user1_name'")
        u1_row = cursor.fetchone()
        u1_name = u1_row['value'] if u1_row else "User 1"
        
        cursor.execute("SELECT value FROM settings WHERE key='user2_name'")
        u2_row = cursor.fetchone()
        u2_name = u2_row['value'] if u2_row else "User 2"

        cursor.execute("SELECT title, start_time FROM commitments WHERE user_id=? ORDER BY start_time", (other_uid,))
        commitments = cursor.fetchall()
        cursor.execute("SELECT title FROM goals WHERE user_id=?", (other_uid,))
        goals = cursor.fetchall()
        cursor.execute("SELECT title, deadline FROM projects WHERE user_id=?", (other_uid,))
        projects = cursor.fetchall()
        cursor.execute("SELECT date, start_time, end_time FROM work_shifts WHERE user_id=? ORDER BY date", (other_uid,))
        shifts = cursor.fetchall()

    other_name = u2_name if other_uid == "user2" else u1_name
    lines = [f"👀 Peeking at {other_name}'s Items:\n"]
    
    lines.append("\U0001F4BC Upcoming Work Shifts")
    if not shifts: lines.append("  (None)")
    for s in shifts: 
        if s['start_time'] == 'off':
            lines.append(f"  \u2022 {s['date']}: Off")
        else:
            lines.append(f"  \u2022 {s['date']}: {format_time_ampm(s['start_time'])}-{format_time_ampm(s['end_time'])}")
            
    lines.append("\n\U0001F4CC Appointments")
    if not commitments: lines.append("  (None)")
    for c in commitments: lines.append(f"  \u2022 {c['title']} ({format_time_ampm(c['start_time'])})")
    
    lines.append("\n\U0001F3AF Goals")
    if not goals: lines.append("  (None)")
    for g in goals: lines.append(f"  \u2022 {g['title']}")
    
    lines.append("\n\U0001F4BC Projects")
    if not projects: lines.append("  (None)")
    for p in projects: lines.append(f"  \u2022 {p['title']}")

    await update.message.reply_text("\n".join(lines))



async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return

    photo = update.message.photo[-1]
    photo_file = await context.bot.get_file(photo.file_id)
    
    filename = f"{uuid.uuid4()}.jpg"
    upload_dir = "backend/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)
    
    await photo_file.download_to_drive(filepath)
    
    caption = update.message.caption or "A beautiful memory"
    memory_id = str(uuid.uuid4())
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO memories (id, couple_id, uploader_id, caption, storage_url, event_type)
            VALUES (?, 'default', ?, ?, ?, 'candid')
        ''', (memory_id, context.bot_data.get('user_id', 'user1'), caption, f"/api/memories/files/{filename}"))
        conn.commit()
        
    if on_update_callback:
        on_update_callback()
        
    await update.message.reply_text("Photo saved to your Memories! 📸")

async def cmd_idea(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return
        
    text = " ".join(context.args)
    if not text:
        await update.message.reply_text("Please provide an idea: /idea [text]")
        return
        
    client = get_gemini_client()
    if not client:
        await update.message.reply_text("Gemini API key is not configured.")
        return
        
    prompt = f"Evaluate this local date idea: '{text}'. Return JSON with exactly two keys: 'effort_level' (a string '1', '2', or '3') and 'estimated_cost' (a string '1', '2', or '3')."
    
    try:
        response = await gemini_generate(client, prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3]
            
        data = json.loads(raw_text)
        effort = str(data.get('effort_level', '2'))
        cost = str(data.get('estimated_cost', '2'))
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO bucket_list_items (id, couple_id, item_type, title, estimated_cost, effort_level)
                VALUES (?, 'default', 'activity', ?, ?, ?)
            ''', (str(uuid.uuid4()), text, cost, effort))
            conn.commit()
            
        if on_update_callback:
            on_update_callback()
            
        await update.message.reply_text(f"Added to Local Activities! (Energy: {effort}, Budget: {cost}) 🎲")
    except Exception as e:
        await update.message.reply_text(f"Error: {e}")

async def cmd_trip(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if not is_authorized(user.id, user.username):
        return
        
    text = " ".join(context.args)
    if not text:
        await update.message.reply_text("Please provide a destination or URL: /trip [text]")
        return
        
    # very simple URL detection
    url = None
    title = text
    if "http" in text:
        words = text.split()
        for w in words:
            if w.startswith("http"):
                url = w
                title = text.replace(w, "").strip()
                break
        if not title:
            title = "New Trip Idea"
            
    item_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO bucket_list_items (id, couple_id, item_type, title)
            VALUES (?, 'default', 'destination', ?)
        ''', (item_id, title))
        
        if url:
            cursor.execute('''
                INSERT INTO bucket_list_links (id, bucket_list_item_id, url)
                VALUES (?, ?, ?)
            ''', (str(uuid.uuid4()), item_id, url))
        conn.commit()
        
    if on_update_callback:
        on_update_callback()
        
    await update.message.reply_text("Added to Travel Dream Board! 🗺️")


def build_app(token, user_id):
    from telegram.ext import CallbackQueryHandler
    app = Application.builder().token(token).build()
    app.bot_data["user_id"] = user_id
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("appointment", cmd_appointment))
    app.add_handler(CommandHandler("goal", cmd_goal))
    app.add_handler(CommandHandler("project", cmd_project))
    app.add_handler(CommandHandler("work", cmd_work))
    app.add_handler(CommandHandler("sleep", cmd_sleep))
    app.add_handler(CommandHandler("peek", cmd_peek))
    app.add_handler(CommandHandler("today", cmd_today))
    app.add_handler(CommandHandler("week", cmd_week))
    app.add_handler(CommandHandler("generate", cmd_generate))
    app.add_handler(CommandHandler("list", cmd_list))
    app.add_handler(CommandHandler("reset", cmd_reset))
    app.add_handler(CommandHandler("journal", cmd_journal))
    u1_cmd = get_setting("user1_name", "user1").replace(" ", "").lower()
    u2_cmd = get_setting("user2_name", "user2").replace(" ", "").lower()
    app.add_handler(CommandHandler(f"read{u1_cmd}", cmd_read_user1))
    app.add_handler(CommandHandler(f"read{u2_cmd}", cmd_read_user2))
    app.add_handler(CommandHandler(f"list{u1_cmd}", cmd_list_user1))
    app.add_handler(CommandHandler(f"list{u2_cmd}", cmd_list_user2))
    
    app.add_handler(CommandHandler("idea", cmd_idea))
    app.add_handler(CommandHandler("trip", cmd_trip))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_free_text))
    app.add_handler(CallbackQueryHandler(handle_callback_query))
    return app


async def start_bot_async(on_update=None):
    global bot_apps, on_update_callback, bot_status
    bot_apps = []
    if on_update:
        on_update_callback = on_update
    
    bot_status = "starting"
    if on_update_callback:
        on_update_callback()
    
    token1 = get_setting("user1_telegram_bot_token")
    token2 = get_setting("user2_telegram_bot_token")
    
    apps_to_start = []
    if token1: apps_to_start.append((token1, "user1"))
    if token2: apps_to_start.append((token2, "user2"))
    
    if not apps_to_start:
        logger.warning("No Telegram bot tokens configured.")
        bot_status = "stopped"
        if on_update_callback:
            on_update_callback()
        return False

    success = False
    
    u1_cmd = get_setting("user1_name", "user1").replace(" ", "").lower()
    u2_cmd = get_setting("user2_name", "user2").replace(" ", "").lower()
    u1_name = get_setting("user1_name", "User 1")
    u2_name = get_setting("user2_name", "User 2")
    
    commands_to_set = [
        BotCommand("start", "Start the bot"),
        BotCommand("help", "Show command reference"),
        BotCommand("appointment", "Add a fixed appointment"),
        BotCommand("goal", "Add a flexible goal"),
        BotCommand("project", "Add a project"),
        BotCommand("work", "Set work shifts (e.g. /work Mon 9am-5pm)"),
        BotCommand("sleep", "Set sleep hours (e.g. /sleep 10pm-6am)"),
        BotCommand("peek", "View the other user's items and schedule"),
        BotCommand("today", "View today's schedule"),
        BotCommand("week", "View this week's schedule"),
        BotCommand("generate", "Generate an optimized schedule"),
        BotCommand("list", "List your commitments, goals & projects"),
        BotCommand("reset", "Clear the bot's conversation history"),
        BotCommand("journal", "Write a new journal entry"),
        BotCommand(f"read{u1_cmd}", f"Read {u1_name}'s latest journal entry"),
        BotCommand(f"read{u2_cmd}", f"Read {u2_name}'s latest journal entry"),
        BotCommand(f"list{u1_cmd}", f"List {u1_name}'s recent journal entries"),
        BotCommand(f"list{u2_cmd}", f"List {u2_name}'s recent journal entries")
    ]
    
    for token, uid in apps_to_start:
        try:
            app = build_app(token, uid)
            await app.initialize()
            await app.start()
            await app.bot.set_my_commands(commands_to_set)
            await app.updater.start_polling(drop_pending_updates=True)
            bot_apps.append(app)
            success = True
            logger.info(f"Bot started for {uid} with commands registered.")
        except Exception as e:
            logger.error(f"Failed to start bot for {uid}: {e}")
            
    bot_status = "running" if len(bot_apps) > 0 else "stopped"
    if on_update_callback:
        on_update_callback()
        
    return success

async def stop_bot_async():
    global bot_apps, bot_status
    bot_status = "stopped"
    if on_update_callback:
        on_update_callback()
        
    for app in bot_apps:
        try:
            await app.updater.stop()
            await app.stop()
            await app.shutdown()
        except Exception as e:
            logger.error(f"Error stopping bot: {e}")
    bot_apps = []
    logger.info("Telegram bots stopped.")
