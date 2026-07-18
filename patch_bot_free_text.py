import os
import json

with open('backend/bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the prompt inside handle_free_text
old_prompt_str = """"type": "commitment" or "goal" or "project" or "goal_override","""
new_prompt_str = """"type": "commitment" or "goal" or "project" or "goal_override" or "bucket_list_activity" or "bucket_list_destination",
  "effort_level": "string ('1', '2', or '3') (only for bucket_list_activity)",
  "estimated_cost": "string ('1', '2', or '3') (only for bucket_list_activity)","""

if old_prompt_str in content:
    content = content.replace(old_prompt_str, new_prompt_str)

# 2. Add the insert logic in handle_free_text
# We can search for the end of the goal_override block.
old_exec_str = """                  cursor.execute("SELECT id FROM goals WHERE user_id=? AND title LIKE ?", (user_profile_id, f"%{parsed['title']}%"))
                  row = cursor.fetchone()"""

new_exec_str = """                  cursor.execute("SELECT id FROM goals WHERE user_id=? AND title LIKE ?", (user_profile_id, f"%{parsed['title']}%"))
                  row = cursor.fetchone()
              elif item_type == "bucket_list_activity":
                  conn.execute("INSERT INTO bucket_list_items (id, couple_id, item_type, title, estimated_cost, effort_level) VALUES (?, 'default', 'activity', ?, ?, ?)",
                      (item_id, parsed["title"], str(parsed.get("estimated_cost", "2")), str(parsed.get("effort_level", "2"))))
              elif item_type == "bucket_list_destination":
                  conn.execute("INSERT INTO bucket_list_items (id, couple_id, item_type, title) VALUES (?, 'default', 'destination', ?)",
                      (item_id, parsed["title"]))"""

if old_exec_str in content:
    content = content.replace(old_exec_str, new_exec_str)

with open('backend/bot.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected free text logic")
