import os
import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

memories_code = """
# --- MEMORIES API ---

from backend.models import MemoryCommentSubmit, MemoryReactionSubmit

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# We need to serve the uploads directory statically
# We will mount it before the frontend is mounted.
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/api/memories/upload")
def upload_memory(
    user_id: str = Form(...),
    caption: Optional[str] = Form(""),
    event_type: str = Form("candid"),
    location: Optional[str] = Form(""),
    file: UploadFile = File(...)
):
    couple_id = "default"
    memory_id = str(uuid.uuid4())
    
    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{memory_id}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    storage_url = f"/api/uploads/{filename}"
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO memories (id, couple_id, uploader_id, caption, event_type, location, storage_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (memory_id, couple_id, user_id, caption, event_type, location, storage_url))
        conn.commit()
        
    notify_frontend()
    return {"id": memory_id, "url": storage_url}

@app.get("/api/memories")
def get_memories():
    couple_id = "default"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM memories WHERE couple_id = ? ORDER BY captured_at DESC", (couple_id,))
        memories = [dict(r) for r in cursor.fetchall()]
        
        for m in memories:
            cursor.execute("SELECT * FROM memory_comments WHERE memory_id = ? ORDER BY submitted_at ASC", (m['id'],))
            m['comments'] = [dict(r) for r in cursor.fetchall()]
            
            cursor.execute("SELECT * FROM memory_reactions WHERE memory_id = ?", (m['id'],))
            m['reactions'] = [dict(r) for r in cursor.fetchall()]
            
    return memories

@app.post("/api/memories/{memory_id}/comment")
def add_memory_comment(memory_id: str, payload: MemoryCommentSubmit):
    comment_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO memory_comments (id, memory_id, user_id, comment_text)
            VALUES (?, ?, ?, ?)
        ''', (comment_id, memory_id, payload.user_id, payload.comment_text))
        conn.commit()
    notify_frontend()
    return {"status": "success"}

@app.post("/api/memories/{memory_id}/react")
def toggle_memory_reaction(memory_id: str, payload: MemoryReactionSubmit):
    with get_db() as conn:
        cursor = conn.cursor()
        # Check if exists
        cursor.execute('''
            SELECT id FROM memory_reactions 
            WHERE memory_id = ? AND user_id = ? AND reaction_type = ?
        ''', (memory_id, payload.user_id, payload.reaction_type))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute("DELETE FROM memory_reactions WHERE id = ?", (existing['id'],))
        else:
            rid = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO memory_reactions (id, memory_id, user_id, reaction_type)
                VALUES (?, ?, ?, ?)
            ''', (rid, memory_id, payload.user_id, payload.reaction_type))
        conn.commit()
    notify_frontend()
    return {"status": "success"}

@app.get("/api/memories/recap")
def get_memory_recap():
    # Simple logic: pick up to 10 random/highly engaged memories from the last month
    couple_id = "default"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT m.*, 
                (SELECT COUNT(*) FROM memory_reactions WHERE memory_id = m.id) as rx_count,
                (SELECT COUNT(*) FROM memory_comments WHERE memory_id = m.id) as c_count
            FROM memories m
            WHERE couple_id = ?
            ORDER BY (rx_count + c_count) DESC, captured_at DESC
            LIMIT 15
        ''', (couple_id,))
        memories = [dict(r) for r in cursor.fetchall()]
        
    return {"recap": memories}

# --- Serve Frontend ---"""

new_content = content.replace("# --- Serve Frontend ---", memories_code)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Injected Memory routes!")
