"""
Main FastAPI application entry point.
Mounts all feature routers, configures SSE (Server-Sent Events) for real-time frontend updates,
and manages the background lifecycle of Telegram bots and cron jobs.
"""

import asyncio
import uuid
import json
import os
import webbrowser
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import shutil
from datetime import datetime, timedelta

from backend.database import init_db, get_db, set_setting, get_setting
from backend.bot import start_bot_async, stop_bot_async, bot_apps
from backend.scheduler import generate_schedule
from backend.schedule_engine import build_busy_grid, suggest_goal_slots, suggest_project_slots

async def trip_memories_cron():
    """
    Background worker that runs daily to detect trips that ended yesterday.
    
    Why:
    - Actively prompts the couple to preserve their trip by sending them a direct link
      to the Memories tab with the location prefilled, removing friction from the upload process.
    """
    while True:
        try:
            # Check for trips ending yesterday
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM trips")
                trips = cursor.fetchall()
                
            # Filter trips that ended yesterday by parsing the 'dates' column
            ended_yesterday = []
            for t in trips:
                if t.get('dates') and ' to ' in t['dates']:
                    end_dt_str = t['dates'].split(' to ')[1]
                    if end_dt_str == yesterday:
                        ended_yesterday.append(t)
                
            for t in ended_yesterday:
                dest = t['destination']
                link = f"http://localhost:5173/?tab=memories&upload=true&prefill_location={dest}"
                msg = f"Welcome back from {dest}! Tap to save your favorite moments:\n{link}"
                
                # Send to both users using bot_apps
                u1_chat = get_setting('user1_telegram_chat_id')
                u2_chat = get_setting('user2_telegram_chat_id')
                
                for chat_id in [u1_chat, u2_chat]:
                    if chat_id:
                        for app in bot_apps:
                            await app.bot.send_message(chat_id=chat_id, text=msg)
        except Exception as e:
            print("Trip cron error:", e)
        
        await asyncio.sleep(86400) # Sleep 24 hours

logger = logging.getLogger(__name__)

# --- SSE Notification Manager ---
class NotificationManager:
    """
    Manages Server-Sent Events (SSE) connections to the frontend.
    
    Why:
    - Allows the backend (e.g. the Telegram bot) to push real-time UI updates to connected React clients
      without forcing the frontend to constantly poll the server.
    """
    def __init__(self):
        self.queues: List[asyncio.Queue] = []

    def notify_all(self):
        for q in self.queues:
            q.put_nowait("refresh")

    async def stream_events(self):
        q = asyncio.Queue()
        self.queues.append(q)
        try:
            while True:
                msg = await q.get()
                yield f"data: {msg}\n\n"
        except asyncio.CancelledError:
            self.queues.remove(q)

notifier = NotificationManager()

def notify_frontend():
    notifier.notify_all()

# --- App Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    await start_bot_async(on_update=notify_frontend)
    asyncio.create_task(trip_memories_cron())
    yield
    # Shutdown
    await stop_bot_async()

from backend.trips_api import trips_router
from backend.bucket_list_api import bucket_list_router
app = FastAPI(title="Couple Scheduler API", lifespan=lifespan)
app.include_router(trips_router)
app.include_router(bucket_list_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class SettingPayload(BaseModel):
    key: str
    value: str

class CommitmentPayload(BaseModel):
    title: str
    start_time: str
    end_time: str
    is_fixed: bool = True
    user_id: str = "user1"
    is_date: bool = False
    date_idea_id: Optional[str] = None

class GoalPayload(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    duration_minutes: int
    target_per_week: int
    preferred_time_of_day: str
    start_date: Optional[str] = None
    ramp_offset: int = 0

class ProjectPayload(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    total_hours: int
    deadline: Optional[str] = None
    start_date: Optional[str] = None

class ScheduleRequest(BaseModel):
    start_date: str
    end_date: str

class WorkShiftPayload(BaseModel):
    user_id: str
    date: str
    start_time: str
    end_time: str
    label: Optional[str] = None

class SwipePayload(BaseModel):
    user_id: str
    date_idea_id: str
    direction: str

class DatePlanPayload(BaseModel):
    place: str = ""
    address: str = ""
    phone: str = ""
    website: str = ""
    notes: str = ""
    start_time: str
    end_time: str

class SleepSchedulePayload(BaseModel):
    user_id: str
    schedule_type: str
    schedule_value: str
    start_time: str
    end_time: str

class JournalEntryPayload(BaseModel):
    user_id: str
    content: str

class JournalCommentPayload(BaseModel):
    user_id: str
    content: str

class JournalReactionPayload(BaseModel):
    user_id: str
    reaction: str

class JournalEnhancePayload(BaseModel):
    content: str


# --- Advanced Calendar & Interactive Endpoints ---
class SkipPayload(BaseModel):
    item_id: str
    item_type: str
    skip_week_start: str

@app.post("/api/schedule/item/skip")
def api_skip_item(payload: SkipPayload):
    ex_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute("INSERT INTO exemptions (id, item_id, item_type, skip_week_start) VALUES (?, ?, ?, ?)",
            (ex_id, payload.item_id, payload.item_type, payload.skip_week_start))
        conn.commit()
    
    # Auto-regenerate schedule for that week
    try:
        from backend.scheduler import generate_schedule
        from datetime import datetime, timedelta
        dt = datetime.strptime(payload.skip_week_start, "%Y-%m-%d")
        end_dt = dt + timedelta(days=6)
        generate_schedule(payload.skip_week_start, end_dt.strftime("%Y-%m-%d"))
    except:
        pass # If regen fails, just keep going
    
    notify_frontend()
    return {"status": "skipped"}

class CommitmentUpdatePayload(BaseModel):
    title: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_fixed: Optional[bool] = None
    user_id: Optional[str] = None
    is_date: Optional[bool] = None
    date_idea_id: Optional[str] = None

def sync_commitment_to_schedules(commitment_id: str, delete: bool = False, title: str = None, start_time: str = None, end_time: str = None, user_id: str = None):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, schedule_json FROM schedules")
        rows = cursor.fetchall()
        for row in rows:
            sched_id = row["id"]
            sched_data = json.loads(row["schedule_json"])
            updated = False
            if "days" in sched_data:
                # We need to find the slot
                target_slot = None
                old_date_str = None
                for d_str, slots in sched_data["days"].items():
                    for slot in slots:
                        if slot.get("type") == "commitment" and slot.get("item_id") == commitment_id:
                            target_slot = slot
                            old_date_str = d_str
                            break
                    if target_slot:
                        break
                
                if target_slot:
                    # Remove from old date
                    sched_data["days"][old_date_str] = [s for s in sched_data["days"][old_date_str] if not (s.get("type") == "commitment" and s.get("item_id") == commitment_id)]
                    if not sched_data["days"][old_date_str]:
                        del sched_data["days"][old_date_str]
                    
                    if not delete:
                        # Update fields
                        if title is not None:
                            target_slot["title"] = title
                        if user_id is not None:
                            target_slot["user_id"] = user_id
                        
                        new_date_str = old_date_str
                        if start_time is not None:
                            parts = start_time.replace('T', ' ').split(' ')
                            new_date_str = parts[0]
                            time_part = parts[1][:5]
                            target_slot["start_time"] = time_part
                        if end_time is not None:
                            parts = end_time.replace('T', ' ').split(' ')
                            time_part = parts[1][:5]
                            target_slot["end_time"] = time_part
                        
                        # Add back to the new/same date list
                        if new_date_str not in sched_data["days"]:
                            sched_data["days"][new_date_str] = []
                        sched_data["days"][new_date_str].append(target_slot)
                        # Sort by time
                        sched_data["days"][new_date_str].sort(key=lambda s: s.get("start_time", "00:00"))
                    
                    # Update DB
                    cursor.execute("UPDATE schedules SET schedule_json = ? WHERE id = ?", (json.dumps(sched_data), sched_id))
                    updated = True
        conn.commit()

class GoalSuggestRequest(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    duration_minutes: int
    target_days: int
    preferred_time: str
    draft_slots: list

class ProjectSuggestRequest(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    hours_needed: float
    draft_slots: list

class SubmitScheduleRequest(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    slots: list

@app.put("/api/commitments/{item_id}")
def api_update_commitment(item_id: str, payload: CommitmentUpdatePayload):
    # Sync first to schedules table JSON
    try:
        sync_commitment_to_schedules(
            item_id, 
            delete=False, 
            title=payload.title, 
            start_time=payload.start_time, 
            end_time=payload.end_time, 
            user_id=payload.user_id
        )
    except Exception as sync_err:
        logging.error(f"Failed to sync updates: {sync_err}")

    with get_db() as conn:
        cursor = conn.cursor()
        update_fields = []
        params = []
        for field, value in payload.model_dump(exclude_unset=True).items():
            update_fields.append(f"{field} = ?")
            params.append(value)
            
        if update_fields:
            params.append(item_id)
            sql = f"UPDATE commitments SET {', '.join(update_fields)} WHERE id = ?"
            try:
                cursor.execute(sql, tuple(params))
            except sqlite3.OperationalError:
                # Fallback for legacy columns
                legacy_fields = ['title', 'start_time', 'end_time', 'is_fixed', 'user_id']
                filtered_fields = []
                filtered_params = []
                for field, value in payload.model_dump(exclude_unset=True).items():
                    if field in legacy_fields:
                        filtered_fields.append(f"{field} = ?")
                        filtered_params.append(value)
                if filtered_fields:
                    filtered_params.append(item_id)
                    sql_legacy = f"UPDATE commitments SET {', '.join(filtered_fields)} WHERE id = ?"
                    cursor.execute(sql_legacy, tuple(filtered_params))
            conn.commit()
            
    notify_frontend()
    return {"status": "updated"}

@app.get("/api/calendar/future")
def api_future_calendar():
    from datetime import datetime, timedelta
    now = datetime.now()
    end_of_month = now + timedelta(days=60)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fixed commitments
        cursor.execute("SELECT * FROM commitments WHERE start_time >= ?", (now.strftime('%Y-%m-%d'),))
        commitments = [dict(row) for row in cursor.fetchall()]
        
        # Best guess for Goals
        cursor.execute("SELECT * FROM goals")
        goals = [dict(row) for row in cursor.fetchall()]
        
        # Best guess for Projects
        cursor.execute("SELECT * FROM projects")
        projects = [dict(row) for row in cursor.fetchall()]
        
        cursor.execute("SELECT * FROM exemptions")
        exemptions = [dict(row) for row in cursor.fetchall()]

    future_events = []
    
    # Add actual commitments
    for c in commitments:
        if c.get("start_time"):
            date_str = c["start_time"][:10]
            future_events.append({
                "date": date_str,
                "title": c["title"],
                "type": "commitment",
                "is_fixed": True,
                "start_time": c["start_time"][11:16] if len(c["start_time"]) > 11 else "",
                "user_id": c.get("user_id"),
                "item_id": c.get("id")
            })
                    
    return {"events": future_events}

@app.get("/api/goals/ramping")
def api_get_ramping_goals():
    from datetime import datetime, timedelta
    now = datetime.now()
    schedule_start_dt = now - timedelta(days=now.weekday())
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM goals")
        goals = [dict(row) for row in cursor.fetchall()]
        
    ramping_goals = []
    for g in goals:
        if not g.get("start_date"): continue
        try:
            goal_start_dt = datetime.strptime(g["start_date"], "%Y-%m-%d")
            weeks_since_start = max(0, (schedule_start_dt - goal_start_dt).days // 7)
            ramp_offset = g.get("ramp_offset", 0) or 0
            effective_week = max(1, weeks_since_start - ramp_offset + 1)
            if effective_week < g["target_per_week"]:
                ramping_goals.append({
                    "id": g["id"],
                    "title": g["title"],
                    "target_per_week": g["target_per_week"],
                    "effective_target": effective_week
                })
        except: pass
        
    return {"ramping": ramping_goals}

@app.post("/api/goals/{goal_id}/pause_ramp")
def api_pause_goal_ramp(goal_id: str):
    with get_db() as conn:
        conn.execute("UPDATE goals SET ramp_offset = ramp_offset + 1 WHERE id=?", (goal_id,))
        conn.commit()
    return {"status": "paused"}

# --- Event Stream ---
@app.get("/api/stream")
async def sse_stream():
    return StreamingResponse(notifier.stream_events(), media_type="text/event-stream")

# --- Geocoding Proxy ---
@app.get("/api/geocoding/search")
async def api_geocoding_search(q: str, lat: Optional[float] = None, lon: Optional[float] = None, type: Optional[str] = "address"):
    import httpx
    headers = {"User-Agent": "CoupleScheduler/1.0"}
    params = {"format": "json", "q": q, "limit": 5, "countrycodes": "us"}
    if lat is not None and lon is not None:
        params["lat"] = str(lat)
        params["lon"] = str(lon)
        
    async with httpx.AsyncClient() as client:
        # If type is address, do direct Nominatim geocoding only
        if type == "address":
            try:
                resp = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params=params,
                    headers=headers,
                    timeout=5.0
                )
                return resp.json() if resp.status_code == 200 else []
            except Exception as e:
                logging.error(f"Nominatim lookup error: {e}")
                return []

        # If type is activity, skip Nominatim direct lookup and use Gemini POI search
        results = []
        api_key = get_setting('gemini_api_key')
        if not api_key:
            return results

        try:
            from google import genai
            
            ref_lat = lat
            ref_lon = lon
            if ref_lat is None or ref_lon is None:
                try:
                    ref_lat = float(get_setting('home_latitude'))
                    ref_lon = float(get_setting('home_longitude'))
                except:
                    pass
            
            near_str = f"coordinates (latitude: {ref_lat}, longitude: {ref_lon})" if (ref_lat and ref_lon) else "Missouri, United States"
            
            prompt = f"""
            Identify 3-5 real, specific venues, parks, business places, or locations in the United States where someone can do the activity or POI '{q}'.
            Sort the locations by proximity to the reference location near the {near_str}. 
            Start searching within a 50-mile radius, expanding to a 200-mile radius, and then national scale if no venues exist nearby, but prioritize the closest possible options in the United States.
            
            Return the results STRICTLY as a raw JSON array of objects, containing:
            - "name": The name of the place
            - "address": The approximate address, city, or nearest town in the United States where it is located.
            - "effort_level": An integer (1, 2, or 3) representing the physical/energy effort level (1 = Chill/relaxed, 2 = Moderate, 3 = Active/sports/demanding).
            - "estimated_cost": An integer (1, 2, or 3) representing the estimated cost category (1 = Low/Free, 2 = Moderate, 3 = High).
            
            Format example:
            [
              {{"name": "Meramec Caverns", "address": "Stanton, MO", "effort_level": 2, "estimated_cost": 2}}
            ]
            """
            
            genai_client = genai.Client(api_key=api_key)
            ai_resp = None
            # Try multiple models to handle potential demand 503 limits
            for model_name in ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash-lite']:
                try:
                    ai_resp = genai_client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                    )
                    if ai_resp and ai_resp.text:
                        break
                except Exception as model_err:
                    logging.warning(f"Failed using model {model_name}: {model_err}")
            
            if not ai_resp or not ai_resp.text:
                return results
                
            text = ai_resp.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            venues = json.loads(text)
            
            # Geocode each suggested venue (restricted to US)
            import math
            ai_results = []
            for item in venues:
                v_name = item.get("name", "")
                v_addr = item.get("address", "")
                if not v_name:
                    continue
                    
                geo_q = f"{v_name}, {v_addr}"
                try:
                    geo_resp = await client.get(
                        "https://nominatim.openstreetmap.org/search",
                        params={"format": "json", "q": geo_q, "limit": 1, "countrycodes": "us"},
                        headers=headers,
                        timeout=4.0
                    )
                    geo_data = geo_resp.json() if geo_resp.status_code == 200 else []
                    
                    # Fallback to geocoding just the address/city if full name search fails
                    if not geo_data and v_addr:
                        geo_resp = await client.get(
                            "https://nominatim.openstreetmap.org/search",
                            params={"format": "json", "q": v_addr, "limit": 1, "countrycodes": "us"},
                            headers=headers,
                            timeout=4.0
                        )
                        geo_data = geo_resp.json() if geo_resp.status_code == 200 else []
                        
                    if geo_data:
                        place = geo_data[0]
                        plat = float(place.get("lat"))
                        plon = float(place.get("lon"))
                        
                        # Calculate distance if we have reference coords
                        dist_miles = 999999.0
                        if ref_lat is not None and ref_lon is not None:
                            try:
                                R = 3958.8  # Earth radius in miles
                                phi1 = math.radians(ref_lat)
                                phi2 = math.radians(plat)
                                dphi = math.radians(plat - ref_lat)
                                dlon = math.radians(plon - ref_lon)
                                a = math.sin(dphi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlon/2.0)**2
                                c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
                                dist_miles = R * c
                            except Exception as dist_err:
                                logging.error(f"Distance calc error: {dist_err}")
                                
                        ai_results.append({
                            "place_id": place.get("place_id", hash(v_name)),
                            "display_name": f"{v_name} ({place.get('display_name')})",
                            "lat": place.get("lat"),
                            "lon": place.get("lon"),
                            "distance": dist_miles,
                            "effort_level": item.get("effort_level"),
                            "estimated_cost": item.get("estimated_cost")
                        })
                except Exception as geo_err:
                    logging.error(f"Failed geocoding suggested venue {geo_q}: {geo_err}")
                    
            if ai_results:
                # Sort by distance to ensure the closest is first
                ai_results.sort(key=lambda x: x.get("distance", 999999.0))
                return ai_results
                
        except Exception as ai_err:
            logging.error(f"Gemini POI search error: {ai_err}")
            
        return results

# --- Settings ---
@app.get("/api/settings")
def api_get_settings():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        return [{"key": row["key"], "value": row["value"]} for row in cursor.fetchall()]

@app.post("/api/settings")
def api_set_setting(payload: SettingPayload):
    set_setting(payload.key, payload.value)
    return {"status": "success"}

@app.post("/api/settings/bulk")
def api_set_settings_bulk(payload: List[SettingPayload]):
    """
    Saves multiple global settings in a single database connection.
    
    Why:
    - Avoids opening and closing database connections 10 times in rapid succession,
      completely preventing SQLite transaction locks and reducing HTTP request overhead.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        for item in payload:
            cursor.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
                (item.key, item.value)
            )
        conn.commit()
    return {"status": "success"}


# --- Commitments ---
@app.get("/api/commitments")
def api_get_commitments():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM commitments ORDER BY start_time")
        return [dict(row) for row in cursor.fetchall()]

@app.post("/api/commitments")
def api_create_commitment(payload: CommitmentPayload):
    cid = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if new columns exist, otherwise fallback
        try:
            cursor.execute(
                "INSERT INTO commitments (id, user_id, title, start_time, end_time, is_fixed, is_date, date_idea_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (cid, payload.user_id, payload.title, payload.start_time, payload.end_time, payload.is_fixed, payload.is_date, payload.date_idea_id)
            )
        except sqlite3.OperationalError:
            cursor.execute(
                "INSERT INTO commitments (id, user_id, title, start_time, end_time, is_fixed) VALUES (?, ?, ?, ?, ?, ?)",
                (cid, payload.user_id, payload.title, payload.start_time, payload.end_time, payload.is_fixed)
            )
        
        conn.commit()
    notify_frontend()
    return {"id": cid}

@app.delete("/api/commitments/{item_id}")
def api_delete_commitment(item_id: str):
    try:
        sync_commitment_to_schedules(item_id, delete=True)
    except Exception as sync_err:
        logging.error(f"Failed to sync deletion: {sync_err}")
        
    with get_db() as conn:
        conn.execute("DELETE FROM commitments WHERE id = ?", (item_id,))
        conn.commit()
    notify_frontend()
    return {"status": "deleted"}


# --- Goals ---
@app.get("/api/goals")
def api_get_goals():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM goals")
        return [dict(row) for row in cursor.fetchall()]

@app.post("/api/goals")
def api_create_goal(payload: GoalPayload):
    g_id = str(uuid.uuid4())
    if not payload.start_date:
        from datetime import datetime
        payload.start_date = datetime.now().strftime('%Y-%m-%d')
    with get_db() as conn:
        conn.execute(
            "INSERT INTO goals (id, title, duration_minutes, target_per_week, preferred_time_of_day, user_id, start_date, ramp_offset) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (g_id, payload.title, payload.duration_minutes, payload.target_per_week, payload.preferred_time_of_day, payload.user_id, payload.start_date, payload.ramp_offset)
        )
        conn.commit()
    notify_frontend()
    return {"id": g_id}

@app.delete("/api/goals/{item_id}")
def api_delete_goal(item_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM goals WHERE id = ?", (item_id,))
        conn.commit()
    notify_frontend()
    return {"status": "deleted"}


# --- Projects ---
@app.get("/api/projects")
def api_get_projects():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects")
        return [dict(row) for row in cursor.fetchall()]

@app.post("/api/projects")
def api_create_project(payload: ProjectPayload):
    p_id = str(uuid.uuid4())
    if not payload.start_date:
        from datetime import datetime
        payload.start_date = datetime.now().strftime('%Y-%m-%d')
    with get_db() as conn:
        conn.execute(
            "INSERT INTO projects (id, title, total_hours, deadline, user_id, start_date) VALUES (?, ?, ?, ?, ?, ?)",
            (p_id, payload.title, payload.total_hours, payload.deadline, payload.user_id, payload.start_date)
        )
        conn.commit()
    notify_frontend()
    return {"id": p_id}

@app.delete("/api/projects/{item_id}")
def api_delete_project(item_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (item_id,))
        conn.commit()
    notify_frontend()
    return {"status": "deleted"}


# --- Work Shifts ---
@app.get("/api/workshifts")
def api_get_workshifts():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM work_shifts ORDER BY date, start_time")
        return [dict(row) for row in cursor.fetchall()]

@app.post("/api/workshifts")
def api_create_workshift(payload: WorkShiftPayload):
    w_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            "INSERT INTO work_shifts (id, user_id, date, start_time, end_time, label) VALUES (?, ?, ?, ?, ?, ?)",
            (w_id, payload.user_id, payload.date, payload.start_time, payload.end_time, payload.label)
        )
        conn.commit()
    notify_frontend()
    return {"id": w_id}

@app.delete("/api/workshifts/{item_id}")
def api_delete_workshift(item_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM work_shifts WHERE id = ?", (item_id,))
        conn.commit()
    notify_frontend()
    return {"status": "deleted"}


# --- Sleep Schedules ---
@app.get("/api/sleep")
def api_get_sleep_schedules():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sleep_schedules ORDER BY created_at")
        return [dict(row) for row in cursor.fetchall()]

@app.post("/api/sleep")
def api_create_sleep_schedule(payload: SleepSchedulePayload):
    s_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute(
            "INSERT INTO sleep_schedules (id, user_id, schedule_type, schedule_value, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)",
            (s_id, payload.user_id, payload.schedule_type, payload.schedule_value, payload.start_time, payload.end_time)
        )
        conn.commit()
    notify_frontend()
    return {"id": s_id}

@app.delete("/api/sleep/{item_id}")
def api_delete_sleep_schedule(item_id: str):
    with get_db() as conn:
        conn.execute("DELETE FROM sleep_schedules WHERE id = ?", (item_id,))
        conn.commit()
    notify_frontend()
    return {"status": "deleted"}


# --- Schedule ---
# --- Schedule ---
@app.post("/api/schedule/generate")
def api_generate_schedule(req: ScheduleRequest):
    # Backward compatibility endpoint, just return empty schedule or mock
    return {"days": {}, "warnings": []}

@app.get("/api/schedule/wizard-data")
def api_get_wizard_data(user_id: str, start_date: str, end_date: str):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Sleep schedules
        cursor.execute("SELECT * FROM sleep_schedules WHERE user_id = ?", (user_id,))
        sleep = [dict(row) for row in cursor.fetchall()]
        
        # 2. Work shifts
        cursor.execute("SELECT * FROM work_shifts WHERE user_id = ? AND date >= ? AND date <= ?", (user_id, start_date, end_date))
        work = [dict(row) for row in cursor.fetchall()]
        
        # 3. Commitments
        cursor.execute("SELECT * FROM commitments WHERE user_id = ? AND (start_time IS NULL OR start_time <= ?) AND (end_time IS NULL OR end_time >= ?)", (user_id, end_date + "T23:59:59", start_date + "T00:00:00"))
        commitments = [dict(row) for row in cursor.fetchall()]
        
        # 4. Goals (with ramp target)
        cursor.execute("SELECT * FROM goals WHERE user_id = ?", (user_id,))
        goals = [dict(row) for row in cursor.fetchall()]
        
        # 5. Projects (only if start_date <= end_date, meaning the project has started or starts this week)
        cursor.execute("SELECT * FROM projects WHERE user_id = ? AND (start_date IS NULL OR start_date <= ?)", (user_id, end_date))
        projects = [dict(row) for row in cursor.fetchall()]
        
        # Pre-build sleep and work slots for the draft
        base_slots = []
        
        # Block out sleep
        for s in sleep:
            s_start = s.get('start_time', '22:00')
            s_end = s.get('end_time', '06:00')
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            
            applicable_days = []
            if s.get('schedule_type') == 'weekly':
                days_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
                val = s.get('schedule_value', '')
                for day_name, idx in days_map.items():
                    if day_name in val:
                        applicable_days.append(idx)
            else:
                s_date = s.get('schedule_value', '')
                try:
                    s_dt = datetime.strptime(s_date, "%Y-%m-%d")
                    d_idx = (s_dt - start_dt).days
                    if 0 <= d_idx < 7:
                        applicable_days.append(d_idx)
                except:
                    pass
                    
            for d in applicable_days:
                day_date = (start_dt + timedelta(days=d)).strftime("%Y-%m-%d")
                if s_start > s_end: # crosses midnight
                    next_day_date = (start_dt + timedelta(days=d+1)).strftime("%Y-%m-%d")
                    base_slots.append({
                        "start_time": s_start,
                        "end_time": "24:00",
                        "title": "Sleep",
                        "type": "sleep",
                        "user_id": user_id,
                        "date": day_date
                    })
                    base_slots.append({
                        "start_time": "00:00",
                        "end_time": s_end,
                        "title": "Sleep",
                        "type": "sleep",
                        "user_id": user_id,
                        "date": next_day_date
                    })
                else:
                    base_slots.append({
                        "start_time": s_start,
                        "end_time": s_end,
                        "title": "Sleep",
                        "type": "sleep",
                        "user_id": user_id,
                        "date": day_date
                    })
                    
        # Block out work
        for w in work:
            base_slots.append({
                "start_time": w["start_time"],
                "end_time": w["end_time"],
                "title": f"Work ({w.get('label', 'Shift')})",
                "type": "work",
                "user_id": user_id,
                "date": w["date"]
            })
            
        # Block out commitments
        for c in commitments:
            if not c.get('start_time'): continue
            c_date = c['start_time'][:10]
            t_start = c['start_time'][11:16]
            t_end = c['end_time'][11:16] if c.get('end_time') else t_start
            base_slots.append({
                "start_time": t_start,
                "end_time": t_end,
                "title": c["title"],
                "type": "commitment",
                "user_id": user_id,
                "date": c_date,
                "item_id": c["id"]
            })

        # Calculate effective targets for goals (ramp-up logic)
        for g in goals:
            goal_start_str = g.get('start_date')
            target = g['target_per_week']
            if goal_start_str:
                try:
                    goal_start_dt = datetime.strptime(goal_start_str, "%Y-%m-%d")
                    schedule_start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                    weeks_since_start = max(0, (schedule_start_dt - goal_start_dt).days // 7)
                    ramp_offset = g.get('ramp_offset', 0) or 0
                    effective_week = max(1, weeks_since_start - ramp_offset + 1)
                    target = min(effective_week, g['target_per_week'])
                except:
                    pass
            g['effective_target'] = target

        return {
            "base_slots": base_slots,
            "goals": goals,
            "projects": projects
        }

@app.post("/api/schedule/suggest/goal")
def api_suggest_goal(req: GoalSuggestRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sleep_schedules WHERE user_id = ?", (req.user_id,))
        sleep = [dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT * FROM work_shifts WHERE user_id = ? AND date >= ? AND date <= ?", (req.user_id, req.start_date, req.end_date))
        work = [dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT * FROM commitments WHERE user_id = ?", (req.user_id,))
        commitments = [dict(row) for row in cursor.fetchall()]
        
    grid = build_busy_grid(req.start_date, req.end_date, sleep, work, commitments, req.draft_slots, req.user_id)
    options = suggest_goal_slots(grid, req.duration_minutes, req.target_days, req.preferred_time, req.start_date)
    return {"options": options}

@app.post("/api/schedule/suggest/project")
def api_suggest_project(req: ProjectSuggestRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sleep_schedules WHERE user_id = ?", (req.user_id,))
        sleep = [dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT * FROM work_shifts WHERE user_id = ? AND date >= ? AND date <= ?", (req.user_id, req.start_date, req.end_date))
        work = [dict(row) for row in cursor.fetchall()]
        cursor.execute("SELECT * FROM commitments WHERE user_id = ?", (req.user_id,))
        commitments = [dict(row) for row in cursor.fetchall()]
        
    grid = build_busy_grid(req.start_date, req.end_date, sleep, work, commitments, req.draft_slots, req.user_id)
    options = suggest_project_slots(grid, req.hours_needed, req.start_date)
    return {"options": options}

@app.post("/api/schedule/submit")
def api_submit_schedule(req: SubmitScheduleRequest):
    days = {}
    for slot in req.slots:
        slot_date = slot.get("date")
        if not slot_date: continue
        if slot_date not in days:
            days[slot_date] = []
        days[slot_date].append({
            "start_time": slot["start_time"],
            "end_time": slot["end_time"],
            "title": slot["title"],
            "type": slot["type"],
            "user_id": req.user_id,
            "item_id": slot.get("item_id")
        })
        
    schedule_data = {
        "days": days,
        "warnings": []
    }
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Rollback project hours from previous schedule
        cursor.execute("SELECT schedule_json FROM schedules WHERE user_id = ? AND start_date = ?", (req.user_id, req.start_date))
        prev_row = cursor.fetchone()
        if prev_row:
            try:
                prev_data = json.loads(prev_row['schedule_json'])
                for p_day in prev_data.get("days", {}).values():
                    for p_slot in p_day:
                        if p_slot.get("type") == "project" and p_slot.get("item_id"):
                            sh, sm = map(int, p_slot["start_time"].split(":"))
                            eh, em = map(int, p_slot["end_time"].split(":"))
                            dur_hours = (eh * 60 + em - (sh * 60 + sm)) / 60.0
                            cursor.execute("UPDATE projects SET hours_allocated = MAX(0, hours_allocated - ?) WHERE id = ?", (dur_hours, p_slot["item_id"]))
            except Exception as e:
                logger.error(f"Failed to rollback prev project hours: {e}")

        # 2. Add project hours from new schedule
        for slot in req.slots:
            if slot.get("type") == "project" and slot.get("item_id"):
                try:
                    sh, sm = map(int, slot["start_time"].split(":"))
                    eh, em = map(int, slot["end_time"].split(":"))
                    dur_hours = (eh * 60 + em - (sh * 60 + sm)) / 60.0
                    cursor.execute("UPDATE projects SET hours_allocated = MIN(total_hours, hours_allocated + ?) WHERE id = ?", (dur_hours, slot["item_id"]))
                except Exception as e:
                    logger.error(f"Failed to update project hours: {e}")

        # 3. Delete existing schedule & Insert new schedule
        cursor.execute("DELETE FROM schedules WHERE user_id = ? AND start_date = ?", (req.user_id, req.start_date))
        
        schedule_id = str(uuid.uuid4())
        cursor.execute(
            "INSERT INTO schedules (id, start_date, end_date, schedule_json, user_id) VALUES (?, ?, ?, ?, ?)",
            (schedule_id, req.start_date, req.end_date, json.dumps(schedule_data), req.user_id)
        )
        conn.commit()
        
    notify_frontend()
    return {"status": "success"}

@app.get("/api/schedule/latest")
def api_get_latest_schedule():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Load user1 schedule
        cursor.execute("SELECT schedule_json FROM schedules WHERE user_id = 'user1' ORDER BY created_at DESC LIMIT 1")
        r1 = cursor.fetchone()
        u1_sched = json.loads(r1["schedule_json"]) if r1 else None
        
        # Load user2 schedule
        cursor.execute("SELECT schedule_json FROM schedules WHERE user_id = 'user2' ORDER BY created_at DESC LIMIT 1")
        r2 = cursor.fetchone()
        u2_sched = json.loads(r2["schedule_json"]) if r2 else None
        
    combined_days = {}
    
    # Process user1
    if u1_sched and "days" in u1_sched:
        for date_str, slots in u1_sched["days"].items():
            if date_str not in combined_days:
                combined_days[date_str] = []
            combined_days[date_str].extend(slots)
            
    # Process user2
    if u2_sched and "days" in u2_sched:
        for date_str, slots in u2_sched["days"].items():
            if date_str not in combined_days:
                combined_days[date_str] = []
            combined_days[date_str].extend(slots)
            
    for date_str in combined_days:
        combined_days[date_str].sort(key=lambda s: s.get("start_time", "00:00"))
        
    return {
        "days": combined_days,
        "warnings": [],
        "user1_submitted": u1_sched is not None,
        "user2_submitted": u2_sched is not None,
        "u1_raw": u1_sched,
        "u2_raw": u2_sched
    }

# --- Journal ---
@app.get("/api/journal")
def api_get_journal_entries():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM journal_entries ORDER BY created_at DESC")
        entries = [dict(row) for row in cursor.fetchall()]
        
        for entry in entries:
            cursor.execute("SELECT * FROM journal_comments WHERE entry_id = ? ORDER BY created_at ASC", (entry["id"],))
            entry["comments"] = [dict(row) for row in cursor.fetchall()]
            
            cursor.execute("SELECT * FROM journal_reactions WHERE entry_id = ?", (entry["id"],))
            entry["reactions"] = [dict(row) for row in cursor.fetchall()]
            
        return entries

@app.post("/api/journal")
def api_create_journal_entry(payload: JournalEntryPayload):
    e_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute("INSERT INTO journal_entries (id, user_id, content) VALUES (?, ?, ?)",
            (e_id, payload.user_id, payload.content))
        conn.commit()
    notify_frontend()
    return {"id": e_id}

@app.post("/api/journal/{entry_id}/comments")
def api_create_journal_comment(entry_id: str, payload: JournalCommentPayload):
    c_id = str(uuid.uuid4())
    with get_db() as conn:
        conn.execute("INSERT INTO journal_comments (id, entry_id, user_id, content) VALUES (?, ?, ?, ?)",
            (c_id, entry_id, payload.user_id, payload.content))
        conn.commit()
    notify_frontend()
    return {"id": c_id}

@app.post("/api/journal/{entry_id}/reactions")
def api_toggle_journal_reaction(entry_id: str, payload: JournalReactionPayload):
    with get_db() as conn:
        cursor = conn.cursor()
        # Check if reaction exists for this user/emoji
        cursor.execute("SELECT id FROM journal_reactions WHERE entry_id = ? AND user_id = ? AND reaction = ?", 
                       (entry_id, payload.user_id, payload.reaction))
        existing = cursor.fetchone()
        
        if existing:
            # Toggle off
            cursor.execute("DELETE FROM journal_reactions WHERE id = ?", (existing["id"],))
        else:
            # Toggle on
            r_id = str(uuid.uuid4())
            cursor.execute("INSERT INTO journal_reactions (id, entry_id, user_id, reaction) VALUES (?, ?, ?, ?)",
                (r_id, entry_id, payload.user_id, payload.reaction))
        conn.commit()
    notify_frontend()
    return {"status": "success"}

@app.post("/api/journal/enhance")
async def api_enhance_journal_text(payload: JournalEnhancePayload):
    from backend.text_enhancer import enhance_text
    
    try:
        enhanced = await enhance_text(payload.content)
        return {"enhanced": enhanced}
    except Exception as e:
        logger.error(f"Text enhancement failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="Text enhancement service is temporarily unavailable. Please try again shortly."
        )

@app.put("/api/journal/{entry_id}")
def api_edit_journal_entry(entry_id: str, payload: JournalEnhancePayload):
    with get_db() as conn:
        conn.execute("UPDATE journal_entries SET content = ? WHERE id = ?", (payload.content, entry_id))
        conn.commit()
    notify_frontend()
    return {"status": "success"}

@app.delete("/api/journal/{entry_id}")
def api_delete_journal_entry(entry_id: str):
    with get_db() as conn:
        # Delete dependencies first (or rely on foreign keys if PRAGMA is on)
        conn.execute("DELETE FROM journal_comments WHERE entry_id = ?", (entry_id,))
        conn.execute("DELETE FROM journal_reactions WHERE entry_id = ?", (entry_id,))
        conn.execute("DELETE FROM journal_entries WHERE id = ?", (entry_id,))
        conn.commit()
    notify_frontend()
    return {"status": "success"}

# --- Activity Feed ---
@app.get("/api/recent_activity")
def api_recent_activity():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get actual user names
        cursor.execute("SELECT key, value FROM settings WHERE key IN ('user1_name', 'user2_name')")
        settings_dict = dict(cursor.fetchall())
        u1_name = settings_dict.get('user1_name', 'User 1')
        u2_name = settings_dict.get('user2_name', 'User 2')
        
        def get_name(uid):
            if uid == 'user1': return u1_name
            if uid == 'user2': return u2_name
            return uid
            
        activities = []
        
        # Combine all submissions and get the latest 5
        cursor.execute('''
            SELECT 'appointment' as type, title, user_id, created_at FROM commitments
            UNION ALL
            SELECT 'goal' as type, title, user_id, created_at FROM goals
            UNION ALL
            SELECT 'project' as type, title, user_id, created_at FROM projects
            UNION ALL
            SELECT user_id || '_journal' as type, '' as title, user_id, created_at FROM journal_entries
            ORDER BY created_at DESC LIMIT 5
        ''')
        
        for row in cursor.fetchall():
            type_str, title, uid, created_at = row
            user_name = get_name(uid)
            
            if type_str == 'appointment':
                activities.append({"type": "appointment", "user_id": uid, "text": f"📅 {user_name} added appointment: {title}"})
            elif type_str == 'goal':
                activities.append({"type": "goal", "user_id": uid, "text": f"🎯 {user_name} added goal: {title}"})
            elif type_str == 'project':
                activities.append({"type": "project", "user_id": uid, "text": f"🚀 {user_name} added project: {title}"})
            elif type_str.endswith('_journal'):
                activities.append({"type": type_str, "user_id": uid, "text": f"📝 {user_name} wrote in the journal"})
                
        return activities


# --- Date Ideas & Matches ---
@app.get("/api/dates/swipes")
def api_get_swipes():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT date_idea_id, user1_swipe, user2_swipe FROM date_matches")
        return [{"date_idea_id": row[0], "user1_swipe": row[1], "user2_swipe": row[2]} for row in cursor.fetchall()]

@app.post("/api/dates/swipe")
def api_record_swipe(payload: SwipePayload):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Check if record exists
        cursor.execute("SELECT * FROM date_matches WHERE date_idea_id = ?", (payload.date_idea_id,))
        record = cursor.fetchone()
        
        if record:
            col = "user1_swipe" if payload.user_id == "user1" else "user2_swipe"
            cursor.execute(f"UPDATE date_matches SET {col} = ? WHERE date_idea_id = ?", (payload.direction, payload.date_idea_id))
        else:
            u1_val = payload.direction if payload.user_id == "user1" else "none"
            u2_val = payload.direction if payload.user_id == "user2" else "none"
            cursor.execute("INSERT INTO date_matches (date_idea_id, user1_swipe, user2_swipe) VALUES (?, ?, ?)", 
                           (payload.date_idea_id, u1_val, u2_val))
        conn.commit()
    return {"status": "success"}

@app.post("/api/dates/reset_swipes")
def api_reset_swipes():
    with get_db() as conn:
        cursor = conn.cursor()
        # The user requested to restart the game for non-matches and left-swipes.
        # We delete all records except those where BOTH users swiped right (matches).
        cursor.execute("DELETE FROM date_matches WHERE user1_swipe != 'right' OR user2_swipe != 'right'")
        conn.commit()
    return {"status": "success"}

@app.put("/api/commitments/{cid}/plan")
def api_update_date_plan(cid: str, payload: DatePlanPayload):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE commitments 
            SET start_time = ?, end_time = ?, place = ?, address = ?, phone = ?, website = ?, notes = ?
            WHERE id = ?
        ''', (payload.start_time, payload.end_time, payload.place, payload.address, payload.phone, payload.website, payload.notes, cid))
        conn.commit()
    notify_frontend()
    return {"status": "success"}

# --- Bot Control ---
@app.post("/api/bot/restart")
async def api_restart_bot():
    """
    Restarts Telegram bots in the background.
    
    Why:
    - Initializing and starting polling can block (e.g. if the Telegram token is invalid
      or if the server is offline). Running this asynchronously in the background prevents
      frontend request timeouts (Failed to fetch).
    """
    from backend.bot import bot_status
    if bot_status == "starting":
        return {"status": "starting"}
        
    await stop_bot_async()
    
    # Run bot start asynchronously in the background
    asyncio.create_task(start_bot_async(on_update=notify_frontend))
    return {"status": "restarting"}

@app.get("/api/bot/status")
def api_bot_status():
    """
    Returns the current status of the Telegram bots.
    
    Why:
    - Provides both raw status string and a running boolean for frontend backward compatibility.
    """
    from backend.bot import bot_status
    return {
        "status": bot_status,
        "running": bot_status == "running"
    }


# Moved to bottom
@app.get("/api/qotd")
def api_get_qotd():
    import json
    import random
    from datetime import date
    import os
    
    json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "couples_questions_365.json")
    if not os.path.exists(json_path):
        return {"question": "What is a small habit I have that makes you smile?"}
        
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            questions = json.load(f)
    except:
        return {"question": "What is a small habit I have that makes you smile?"}

    # Group by category
    cats = {}
    for q in questions:
        c = q.get("category", "General")
        if c not in cats:
            cats[c] = []
        cats[c].append(q["question_text"])
        
    cat_keys = sorted(list(cats.keys()))
    if not cat_keys:
        return {"question": "What is a small habit I have that makes you smile?"}
        
    EPOCH_START = date(2026, 1, 1)
    today = date.today()
    epoch_day = max(0, (today - EPOCH_START).days)
    
    num_cats = len(cat_keys)
    block_index = epoch_day // num_cats
    day_within_block = epoch_day % num_cats
    
    # Shuffle categories using block_index as seed
    random.seed(block_index)
    shuffled_cats = list(cat_keys)
    random.shuffle(shuffled_cats)
    
    today_cat = shuffled_cats[day_within_block]
    
    # Select question from today_cat using permanent seed
    cat_qs = cats[today_cat]
    random.seed(today_cat) # Permanent seed for this category
    shuffled_qs = list(cat_qs)
    random.shuffle(shuffled_qs)
    
    q_index = block_index % len(shuffled_qs)
    today_q = shuffled_qs[q_index]
    
    # Restore random state
    random.seed()
    
    return {"question": today_q}

# --- CHECK-INS API ---

from backend.models import CheckInSubmitRequest

@app.get("/api/checkins/current")
def get_current_checkin(user_id: str):
    now = datetime.now()
    month_year = f"{now.year}-{now.month:02d}"
    couple_id = "default" # Hardcoded as per single-couple architecture
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM check_ins WHERE month_year = ? AND couple_id = ?", (month_year, couple_id))
        checkin = cursor.fetchone()
        
        if not checkin:
            checkin_id = str(uuid.uuid4())
            cursor.execute("INSERT INTO check_ins (id, couple_id, month_year, status) VALUES (?, ?, ?, ?)",
                           (checkin_id, couple_id, month_year, 'pending'))
            conn.commit()
            checkin = {"id": checkin_id, "couple_id": couple_id, "month_year": month_year, "status": "pending"}
        else:
            checkin = dict(checkin)
            
        cursor.execute("SELECT * FROM check_in_responses WHERE checkin_id = ?", (checkin['id'],))
        responses = [dict(row) for row in cursor.fetchall()]
        
        has_submitted = any(r['user_id'] == user_id for r in responses)
        partner_has_submitted = any(r['user_id'] != user_id for r in responses)
        
        # If both submitted but status is pending, update it
        if has_submitted and partner_has_submitted and checkin['status'] == 'pending':
            cursor.execute("UPDATE check_ins SET status = 'completed' WHERE id = ?", (checkin['id'],))
            conn.commit()
            checkin['status'] = 'completed'
            
        return {
            "checkin": checkin,
            "has_submitted": has_submitted,
            "status": checkin['status']
        }

@app.post("/api/checkins/submit")
def submit_checkin(user_id: str, payload: CheckInSubmitRequest):
    now = datetime.now()
    month_year = f"{now.year}-{now.month:02d}"
    couple_id = "default"
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, status FROM check_ins WHERE month_year = ? AND couple_id = ?", (month_year, couple_id))
        checkin = cursor.fetchone()
        if not checkin:
            raise HTTPException(status_code=404, detail="Check-in not found for this month")
            
        checkin_id = checkin['id']
        
        cursor.execute("SELECT id FROM check_in_responses WHERE checkin_id = ? AND user_id = ?", (checkin_id, user_id))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Already submitted")
            
        resp_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO check_in_responses 
            (id, checkin_id, user_id, communication_score, intimacy_score, quality_time_score, teamwork_score, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (resp_id, checkin_id, user_id, payload.communication_score, payload.intimacy_score, payload.quality_time_score, payload.teamwork_score, payload.notes))
        
        conn.commit()
        notify_frontend()
        return {"success": True}

@app.get("/api/checkins/results")
def get_checkin_results(month_year: str, user_id: str):
    couple_id = "default"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM check_ins WHERE month_year = ? AND couple_id = ?", (month_year, couple_id))
        checkin = cursor.fetchone()
        if not checkin:
            raise HTTPException(status_code=404, detail="Check-in not found")
            
        cursor.execute("SELECT * FROM check_in_responses WHERE checkin_id = ?", (checkin['id'],))
        responses = [dict(row) for row in cursor.fetchall()]
        
        # Check if both have submitted
        if len(responses) < 2:
            return {"locked": True}
            
        # Get historical data for the last 6 months
        cursor.execute('''
            SELECT ci.month_year, cr.communication_score, cr.intimacy_score, cr.quality_time_score, cr.teamwork_score
            FROM check_ins ci
            JOIN check_in_responses cr ON ci.id = cr.checkin_id
            WHERE ci.couple_id = ? AND ci.status = 'completed'
            ORDER BY ci.month_year DESC LIMIT 12
        ''', (couple_id,))
        
        history_rows = cursor.fetchall()
        
        # Aggregate history by month
        history_map = {}
        for row in history_rows:
            m = row['month_year']
            if m not in history_map:
                history_map[m] = {'count': 0, 'comm': 0, 'intimacy': 0, 'quality': 0, 'team': 0}
            history_map[m]['count'] += 1
            history_map[m]['comm'] += row['communication_score']
            history_map[m]['intimacy'] += row['intimacy_score']
            history_map[m]['quality'] += row['quality_time_score']
            history_map[m]['team'] += row['teamwork_score']
            
        history = []
        for m, data in history_map.items():
            if data['count'] == 2:
                history.append({
                    "month_year": m,
                    "avg_comm": data['comm'] / 2.0,
                    "avg_intimacy": data['intimacy'] / 2.0,
                    "avg_quality": data['quality'] / 2.0,
                    "avg_team": data['team'] / 2.0,
                    "overall_avg": (data['comm'] + data['intimacy'] + data['quality'] + data['team']) / 8.0
                })
                
        history.sort(key=lambda x: x['month_year'])
        # Keep last 6
        history = history[-6:]
            
        return {
            "locked": False,
            "checkin": dict(checkin),
            "responses": responses,
            "history": history
        }


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

# --- Serve Frontend ---
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    webbrowser.open("http://localhost:8080")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8080, reload=True)
