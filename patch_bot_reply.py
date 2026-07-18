import os

with open('backend/bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to change the reply_text at the end of handle_free_text
old_reply_str = """        if item_type == "goal_override":
            await update.message.reply_text(f"\u2705 Paused/overrode ramp-up for goal: {parsed['title']}")
        else:
            user_name = get_setting(f"{user_profile_id}_name", default="User 1" if user_profile_id == "user1" else "User 2")
            await update.message.reply_text(f"o. {item_type.capitalize()} added for {user_name}: {parsed['title']}")
    except Exception as e:"""

new_reply_str = """        if item_type == "goal_override":
            await update.message.reply_text(f"\u2705 Paused/overrode ramp-up for goal: {parsed['title']}")
        elif item_type == "bucket_list_activity":
            await update.message.reply_text(f"\U0001F3B2 Activity added to Bucket List: {parsed['title']}")
        elif item_type == "bucket_list_destination":
            await update.message.reply_text(f"\U0001F5FA\uFE0F Destination added to Dream Board: {parsed['title']}")
        else:
            user_name = get_setting(f"{user_profile_id}_name", default="User 1" if user_profile_id == "user1" else "User 2")
            await update.message.reply_text(f"\u2705 {item_type.capitalize()} added for {user_name}: {parsed['title']}")
    except Exception as e:"""

if old_reply_str in content:
    content = content.replace(old_reply_str, new_reply_str)

with open('backend/bot.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected reply text logic")
