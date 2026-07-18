"""
Bucket List (Someday Board) API routes.
Handles creation and promotion of long-term goals and travel ideas.
"""

import uuid
from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.models import BucketListCreate, BucketListLinkCreate, BucketListUpdate

bucket_list_router = APIRouter(prefix="/api/bucket-list", tags=["bucket_list"])

@bucket_list_router.post("")
def create_bucket_list_item(payload: BucketListCreate):
    item_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO bucket_list_items 
            (id, couple_id, item_type, title, estimated_cost, effort_level, latitude, longitude, address, cover_image_url)
            VALUES (?, 'default', ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item_id, payload.item_type, payload.title, payload.estimated_cost, payload.effort_level,
            payload.latitude, payload.longitude, payload.address, payload.cover_image_url
        ))
        conn.commit()
    return {"id": item_id}

@bucket_list_router.put("/{item_id}")
def update_bucket_list_item(item_id: str, payload: BucketListUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Build dynamic update statement based on provided fields
        update_fields = []
        params = []
        for field, value in payload.model_dump(exclude_unset=True).items():
            update_fields.append(f"{field} = ?")
            params.append(value)
            
        if not update_fields:
            return {"status": "no updates"}
            
        params.append(item_id)
        sql = f"UPDATE bucket_list_items SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(sql, tuple(params))
        conn.commit()
    return {"status": "success"}

@bucket_list_router.get("")
def get_bucket_list():
    """
    Retrieves all bucket list items and their associated links.
    
    Why:
    - Resolves an N+1 query issue by aggregating links in memory using a dictionary lookup
      instead of issuing a separate SELECT query for every bucket list item.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch all items
        cursor.execute("SELECT * FROM bucket_list_items WHERE couple_id = 'default' ORDER BY created_at DESC")
        items = [dict(r) for r in cursor.fetchall()]
        
        if not items:
            return []
            
        # 2. Extract IDs for batch fetching
        item_ids = [item['id'] for item in items]
        placeholders = ','.join('?' for _ in item_ids)
        
        # 3. Fetch all related links in a single query (resolving N+1)
        cursor.execute(f"SELECT * FROM bucket_list_links WHERE bucket_list_item_id IN ({placeholders})", item_ids)
        all_links = cursor.fetchall()
        
        # 4. Group links by item_id in memory
        links_by_item = {}
        for link in all_links:
            item_id = link['bucket_list_item_id']
            if item_id not in links_by_item:
                links_by_item[item_id] = []
            links_by_item[item_id].append(dict(link))
            
        # 5. Attach to items
        for item in items:
            item['links'] = links_by_item.get(item['id'], [])
            
    return items

@bucket_list_router.post("/{item_id}/links")
def add_bucket_list_link(item_id: str, payload: BucketListLinkCreate):
    link_id = str(uuid.uuid4())
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO bucket_list_links (id, bucket_list_item_id, url)
            VALUES (?, ?, ?)
        ''', (link_id, item_id, payload.url))
        conn.commit()
    return {"status": "success", "id": link_id}

@bucket_list_router.post("/promote/{item_id}")
def promote_to_trip(item_id: str):
    """
    Promotes a bucket list destination into a concrete Trip Planner idea.
    
    Why:
    - Operates atomically. It copies the associated inspiration links into the new Trip's resources
      so that research isn't lost when moving a destination from the 'Someday' board to active planning.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM bucket_list_items WHERE id = ?", (item_id,))
        item = cursor.fetchone()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # 1. Update status
        cursor.execute("UPDATE bucket_list_items SET status = 'promoted' WHERE id = ?", (item_id,))
        
        # 2. Create trip
        trip_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT INTO trips (id, couple_id, trip_type, destination, status)
            VALUES (?, 'default', 'dream_board', ?, 'idea')
        ''', (trip_id, item['title']))
        
        # 3. Move links
        cursor.execute("SELECT * FROM bucket_list_links WHERE bucket_list_item_id = ?", (item_id,))
        links = cursor.fetchall()
        for link in links:
            cursor.execute('''
                INSERT INTO trip_resources (id, trip_id, resource_type, content_url, title)
                VALUES (?, ?, 'research_link', ?, ?)
            ''', (str(uuid.uuid4()), trip_id, link['url'], link['url']))
            
        conn.commit()
        
    return {"status": "success", "trip_id": trip_id}

@bucket_list_router.delete("/{item_id}")
def delete_bucket_list_item(item_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM bucket_list_items WHERE id = ?", (item_id,))
        cursor.execute("DELETE FROM bucket_list_links WHERE bucket_list_item_id = ?", (item_id,))
        conn.commit()
    return {"status": "success"}
