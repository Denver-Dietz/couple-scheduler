import os
import uuid
import json
from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.models import (
    TripCreate, TripUpdate,
    TripItineraryCreate, TripItineraryUpdate,
    TripWishlistCreate,
    TripBudgetCreate, TripBudgetUpdate,
    TripLogisticsCreate, TripLogisticsUpdate,
    TripMapItemCreate
)

trips_router = APIRouter(prefix="/api/trips", tags=["trips"])

def fetch_trip_data(cursor, trip_id: str):
    cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
    trip = cursor.fetchone()
    if not trip:
        return None
    trip_dict = dict(trip)
    
    # Itinerary
    cursor.execute("SELECT * FROM trip_itinerary WHERE trip_id = ? ORDER BY day, time", (trip_id,))
    trip_dict['itinerary'] = [dict(r) for r in cursor.fetchall()]
    
    # Wishlist
    cursor.execute("SELECT * FROM trip_wishlist WHERE trip_id = ?", (trip_id,))
    trip_dict['wishlist'] = [dict(r) for r in cursor.fetchall()]
    

    # Budget
    cursor.execute("SELECT * FROM trip_budget WHERE trip_id = ?", (trip_id,))
    trip_dict['budget'] = [dict(r) for r in cursor.fetchall()]
    
    # Logistics
    cursor.execute("SELECT * FROM trip_logistics WHERE trip_id = ?", (trip_id,))
    trip_dict['logistics'] = [dict(r) for r in cursor.fetchall()]
    
    # Map Items
    cursor.execute("SELECT * FROM trip_map_items WHERE trip_id = ?", (trip_id,))
    trip_dict['map_items'] = [dict(r) for r in cursor.fetchall()]

    return trip_dict

@trips_router.get("")
def get_all_trips():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trips WHERE couple_id = 'default' ORDER BY created_at DESC")
        return [dict(r) for r in cursor.fetchall()]

@trips_router.get("/{trip_id}")
def get_trip(trip_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        data = fetch_trip_data(cursor, trip_id)
        if not data:
            raise HTTPException(status_code=404, detail="Trip not found")
        return data

@trips_router.post("")
def create_trip(payload: TripCreate):
    trip_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trips (id, name, dates, destination, cover_photo, mood_tags, progress)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (trip_id, payload.name, payload.dates, payload.destination, payload.cover_photo, payload.mood_tags, payload.progress))
        conn.commit()
    return {"id": trip_id}

@trips_router.put("/{trip_id}")
def update_trip(trip_id: str, payload: TripUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Trip not found")
            
        updates = []
        params = []
        for k, v in payload.dict(exclude_unset=True).items():
            updates.append(f"{k} = ?")
            params.append(v)
            
        if updates:
            params.append(trip_id)
            cursor.execute(f"UPDATE trips SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
            
    return {"status": "success"}

@trips_router.delete("/{trip_id}")
def delete_trip(trip_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
        cursor.execute("DELETE FROM trip_itinerary WHERE trip_id = ?", (trip_id,))
        cursor.execute("DELETE FROM trip_wishlist WHERE trip_id = ?", (trip_id,))
        cursor.execute("DELETE FROM trip_budget WHERE trip_id = ?", (trip_id,))
        cursor.execute("DELETE FROM trip_logistics WHERE trip_id = ?", (trip_id,))
        cursor.execute("DELETE FROM trip_map_items WHERE trip_id = ?", (trip_id,))
        conn.commit()
    return {"status": "success"}

# --- ITINERARY ---
@trips_router.post("/{trip_id}/itinerary")
def create_itinerary_item(trip_id: str, payload: TripItineraryCreate):
    item_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trip_itinerary (id, trip_id, day, title, time, location, notes, partner_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (item_id, trip_id, payload.day, payload.title, payload.time, payload.location, payload.notes, payload.partner_id))
        conn.commit()
    return {"id": item_id}

@trips_router.put("/itinerary/{item_id}")
def update_itinerary_item(item_id: str, payload: TripItineraryUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        params = []
        for k, v in payload.dict(exclude_unset=True).items():
            updates.append(f"{k} = ?")
            params.append(v)
        if updates:
            params.append(item_id)
            cursor.execute(f"UPDATE trip_itinerary SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
    return {"status": "success"}

@trips_router.delete("/itinerary/{item_id}")
def delete_itinerary_item(item_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trip_itinerary WHERE id = ?", (item_id,))
        conn.commit()
    return {"status": "success"}

# --- WISHLIST ---
@trips_router.post("/{trip_id}/wishlist")
def create_wishlist_item(trip_id: str, payload: TripWishlistCreate):
    item_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trip_wishlist (id, trip_id, title, category, partner_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (item_id, trip_id, payload.title, payload.category, payload.partner_id))
        conn.commit()
    return {"id": item_id}

@trips_router.post("/wishlist/{item_id}/vote")
def vote_wishlist_item(item_id: str, user: str, vote: int):
    # vote is 1 for upvote, -1 for downvote, 0 for neutral
    column = "votes_u1" if user == "user1" else "votes_u2"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE trip_wishlist SET {column} = ? WHERE id = ?", (vote, item_id))
        conn.commit()
    return {"status": "success"}

@trips_router.delete("/wishlist/{item_id}")
def delete_wishlist_item(item_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trip_wishlist WHERE id = ?", (item_id,))
        conn.commit()
    return {"status": "success"}

# --- BUDGET ---
@trips_router.post("/{trip_id}/budget")
def create_budget_item(trip_id: str, payload: TripBudgetCreate):
    item_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trip_budget (id, trip_id, category, estimated, actual, paid_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (item_id, trip_id, payload.category, payload.estimated, payload.actual, payload.paid_by))
        conn.commit()
    return {"id": item_id}

@trips_router.put("/budget/{item_id}")
def update_budget_item(item_id: str, payload: TripBudgetUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        params = []
        for k, v in payload.dict(exclude_unset=True).items():
            updates.append(f"{k} = ?")
            params.append(v)
        if updates:
            params.append(item_id)
            cursor.execute(f"UPDATE trip_budget SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
    return {"status": "success"}

@trips_router.delete("/budget/{item_id}")
def delete_budget_item(item_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trip_budget WHERE id = ?", (item_id,))
        conn.commit()
    return {"status": "success"}

# --- LOGISTICS ---
@trips_router.post("/{trip_id}/logistics")
def create_logistics_item(trip_id: str, payload: TripLogisticsCreate):
    item_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trip_logistics (id, trip_id, type, details, files)
            VALUES (?, ?, ?, ?, ?)
        ''', (item_id, trip_id, payload.type, payload.details, payload.files))
        conn.commit()
    return {"id": item_id}

@trips_router.put("/logistics/{item_id}")
def update_logistics_item(item_id: str, payload: TripLogisticsUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        updates = []
        params = []
        for k, v in payload.dict(exclude_unset=True).items():
            updates.append(f"{k} = ?")
            params.append(v)
        if updates:
            params.append(item_id)
            cursor.execute(f"UPDATE trip_logistics SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()
    return {"status": "success"}

@trips_router.delete("/logistics/{item_id}")
def delete_logistics_item(item_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trip_logistics WHERE id = ?", (item_id,))
        conn.commit()
    return {"status": "success"}

# --- MAP ITEMS ---
@trips_router.post("/{trip_id}/map_items")
def create_map_item(trip_id: str, payload: TripMapItemCreate):
    item_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO trip_map_items (id, trip_id, coordinates, category, linked_itinerary_item_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (item_id, trip_id, payload.coordinates, payload.category, payload.linked_itinerary_item_id))
        conn.commit()
    return {"id": item_id}

@trips_router.delete("/map_items/{item_id}")
def delete_map_item(item_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM trip_map_items WHERE id = ?", (item_id,))
        conn.commit()
    return {"status": "success"}
