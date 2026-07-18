"""
Local algorithmic scheduling engine.
Pre-computes a 7x48 (days x 30-min blocks) boolean grid of availability to inject precise hints into the LLM prompt.

Why:
- LLMs are notoriously bad at absolute math and time calculations. By calculating the actual free time blocks
  using standard deterministic code, we drastically improve the AI's ability to schedule events without collisions.
"""

from datetime import datetime, timedelta
import random

def time_to_block(t_str):
    try:
        h, m = map(int, t_str.split(':'))
        return h * 2 + (1 if m >= 30 else 0)
    except:
        return 0

def block_to_time(b):
    h = b // 2
    m = 30 if b % 2 == 1 else 0
    return f"{h:02d}:{m:02d}"

def get_day_index(date_str, start_date_str):
    # Returns 0 for Monday, 6 for Sunday relative to start_date_str
    try:
        d1 = datetime.strptime(date_str[:10], "%Y-%m-%d")
        d2 = datetime.strptime(start_date_str[:10], "%Y-%m-%d")
        return (d1 - d2).days
    except Exception as e:
        return 0

def build_busy_grid(start_date, end_date, sleep_schedules, work_shifts, commitments, draft_slots, user_id):
    """
    Constructs a 2D boolean array representing a week of 30-minute intervals (True = Busy).
    
    Why:
    - 30-minute blocks (48 per day) strike the perfect balance between granularity (allowing 30m goals)
      and performance (small enough array for fast local bitwise-like logic).
    - It merges sleep, work, fixed commitments, and already-drafted flexible goals into one unified layer.
    """
    # 7 days, each day has 48 blocks of 30 mins
    grid = [[False] * 48 for _ in range(7)]
    
    # 1. Sleep Schedules
    # Find sleep schedule for the user
    user_sleep = [s for s in sleep_schedules if s['user_id'] == user_id]
    for s in user_sleep:
        # e.g., start_time="22:30", end_time="07:00"
        s_start_raw = s.get('start_time', '22:00')
        if s_start_raw == '12:00':
            s_start_raw = '00:00' # Fix noon vs midnight common mistake
        s_start = time_to_block(s_start_raw)
        
        s_end_raw = s.get('end_time', '06:00')
        if s_end_raw == '12:00':
            s_end_raw = '00:00'
        s_end = time_to_block(s_end_raw)
        
        # Determine applicable days
        applicable_days = []
        if s.get('schedule_type') == 'weekly':
            days_map = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6}
            val = s.get('schedule_value', '')
            for day_name, idx in days_map.items():
                if day_name in val:
                    applicable_days.append(idx)
        else:
            # specific_date
            d_idx = get_day_index(s.get('schedule_value', ''), start_date)
            if 0 <= d_idx < 7:
                applicable_days.append(d_idx)
                
        # Block off sleep blocks for each day
        for d in applicable_days:
            if s_start > s_end: # Crosses midnight
                for b in range(s_start, 48):
                    grid[d][b] = True
                next_day = (d + 1) % 7
                for b in range(0, s_end):
                    grid[next_day][b] = True
            else:
                for b in range(s_start, s_end):
                    grid[d][b] = True

    # 2. Work Shifts
    user_work = [w for w in work_shifts if w['user_id'] == user_id]
    for w in user_work:
        d_idx = get_day_index(w['date'], start_date)
        if 0 <= d_idx < 7:
            w_start = time_to_block(w.get('start_time', '09:00'))
            w_end = time_to_block(w.get('end_time', '17:00'))
            for b in range(w_start, w_end):
                grid[d_idx][b] = True

    # 3. Fixed commitments
    user_commitments = [c for c in commitments if c['user_id'] == user_id]
    for c in user_commitments:
        if not c.get('start_time'): continue
        # Format: "YYYY-MM-DDTHH:MM:SS" or "YYYY-MM-DD HH:MM"
        c_date = c['start_time'][:10]
        d_idx = get_day_index(c_date, start_date)
        if 0 <= d_idx < 7:
            t_start = c['start_time'][11:16]
            t_end = c['end_time'][11:16] if c.get('end_time') else t_start
            b_start = time_to_block(t_start)
            b_end = time_to_block(t_end)
            if b_start == b_end:
                b_end += 2 # Default 1 hour if start == end
            for b in range(b_start, min(b_end, 48)):
                grid[d_idx][b] = True

    # 4. Draft Slots (already scheduled goals/projects in this run)
    for slot in draft_slots:
        if slot.get('user_id') == user_id and slot.get('start_time') and slot.get('end_time'):
            d_idx = get_day_index(slot['date'], start_date)
            if 0 <= d_idx < 7:
                b_start = time_to_block(slot['start_time'])
                b_end = time_to_block(slot['end_time'])
                for b in range(b_start, min(b_end, 48)):
                    grid[d_idx][b] = True

    return grid

def suggest_goal_slots(grid, duration_mins, target_days, preferred_time, start_date):
    # duration in blocks
    needed_blocks = (duration_mins + 29) // 30
    
    # Time of day ranges in blocks
    # morning: 06:00 - 12:00 (12 to 24)
    # afternoon: 12:00 - 17:00 (24 to 34)
    # evening: 17:00 - 22:00 (34 to 44)
    # night: 22:00 - 06:00 (44 to 48 and 0 to 12)
    pref_ranges = {
        'morning': list(range(12, 24)),
        'afternoon': list(range(24, 34)),
        'evening': list(range(34, 44)),
        'night': list(range(44, 48)) + list(range(0, 12))
    }
    
    candidate_range = pref_ranges.get(preferred_time.lower(), list(range(12, 44))) # Default to day blocks if invalid
    if not candidate_range:
        candidate_range = list(range(0, 48))

    slots = []
    start_date_dt = datetime.strptime(start_date, "%Y-%m-%d")
    
    for d in range(7):
        slot_date = (start_date_dt + timedelta(days=d)).strftime("%Y-%m-%d")
        b = 0
        while b <= 48 - needed_blocks:
            is_free = True
            for check_b in range(b, b + needed_blocks):
                if grid[d][check_b]:
                    is_free = False
                    break
            if is_free:
                score = 0
                if b in candidate_range: score += 100
                if 14 <= b <= 40: score += 50
                
                slots.append({
                    'date': slot_date,
                    'start_time': block_to_time(b),
                    'end_time': block_to_time(b + needed_blocks),
                    'score': score
                })
                b += needed_blocks # Suggest non-overlapping blocks to prevent UI clutter
            else:
                b += 1
                
    # Sort slots by date and time
    # They are already sorted chronologically by the loops, but we can sort by score if desired.
    # UI will group them by day.
    return slots

def suggest_project_slots(grid, hours_needed, start_date):
    chunk_blocks = min(int(hours_needed * 2), 8)
    if chunk_blocks < 1:
        chunk_blocks = 1 # safety
        
    options = []
    start_date_dt = datetime.strptime(start_date, "%Y-%m-%d")
    
    for d in range(7):
        slot_date = (start_date_dt + timedelta(days=d)).strftime("%Y-%m-%d")
        b = 0
        while b <= 48 - chunk_blocks:
            is_free = True
            for check_b in range(b, b + chunk_blocks):
                if grid[d][check_b]:
                    is_free = False
                    break
            if is_free:
                options.append({
                    'date': slot_date,
                    'start_time': block_to_time(b),
                    'end_time': block_to_time(b + chunk_blocks),
                    'allocated_hours': chunk_blocks / 2
                })
                b += chunk_blocks
            else:
                b += 1
                
    return options
