import os

with open('backend/bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_functions = """
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
        
    await update.message.reply_text("Photo saved to your Memories! \U0001F4F8")

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
            
        await update.message.reply_text(f"Added to Local Activities! (Energy: {effort}, Budget: {cost}) \U0001F3B2")
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
        
    await update.message.reply_text("Added to Travel Dream Board! \U0001F5FA\uFE0F")
"""

handler_block = """
    app.add_handler(CommandHandler("idea", cmd_idea))
    app.add_handler(CommandHandler("trip", cmd_trip))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
"""

if "def build_app" in content and "handle_photo" not in content:
    content = content.replace("def build_app", new_functions + "\n\ndef build_app")
    
if "app.add_handler(MessageHandler(filters.TEXT" in content and "cmd_idea" not in content.split("def build_app")[1]:
    content = content.replace("app.add_handler(MessageHandler(filters.TEXT", handler_block + "\n    app.add_handler(MessageHandler(filters.TEXT")
    
with open('backend/bot.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected handlers")
