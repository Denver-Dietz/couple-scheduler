import os

with open('backend/bot.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = """        "/goal <desc> \u2014 Add a flexible habit\n"
        "  _e.g. /goal Gym 3x a week for 45m_\n\n"
        "/project <desc> \u2014 Add a one-off project\n"
        "  _e.g. /project Clean garage next 2 weeks for 5 hrs_\n\n"
        "/generate \u2014 Create the optimized schedule!\n"
        "/today or /week \u2014 View your schedule\n"
        "/peek \u2014 See what the other user is doing\n"
        "/list \u2014 Show raw database items\n"
        "/reset \u2014 Wipe your schedule (keeps items)\n"
        "/journal \u2014 Send a private diary entry\n"
        f"/read{get_setting('user1_name', 'user1').replace(' ', '').lower()} \u2014 Read user1's journal\n"
        f"/list{get_setting('user1_name', 'user1').replace(' ', '').lower()} \u2014 See user1's raw items\n\n"
        "\U0001F4A1 _You can also just type naturally, e.g. 'I need to go to the bank on Friday morning'_"
    )"""

# Fallback string if the full one doesn't match perfectly
old_str_fallback = """        "/goal <desc> \u2014 Add a flexible habit\\n"
        "  _e.g. /goal Gym 3x a week for 45m_\\n\\n"
        "/project <desc> \u2014 Add a one-off project\\n"
        "  _e.g. /project Clean garage next 2 weeks for 5 hrs_\\n\\n"
        "/generate \u2014 Create the optimized schedule!\\n"
        "/today or /week \u2014 View your schedule\\n"
        "/peek \u2014 See what the other user is doing\\n"
        "/list \u2014 Show raw database items\\n"
        "/reset \u2014 Wipe your schedule (keeps items)\\n"
        "/journal \u2014 Send a private diary entry\\n"
        f"/read{context.bot_data.get('user_id', 'unknown')} \u2014 Read your journal\\n"
        f"/list{context.bot_data.get('user_id', 'unknown')} \u2014 See your raw items\\n\\n"
        "\U0001F4A1 _You can also just type naturally, e.g. 'I need to go to the bank on Friday morning'_"
    )"""

new_str = """        "/goal <desc> \u2014 Add a flexible habit\n"
        "  _e.g. /goal Gym 3x a week for 45m_\n\n"
        "/project <desc> \u2014 Add a one-off project\n"
        "  _e.g. /project Clean garage next 2 weeks for 5 hrs_\n\n"
        "/idea <desc> \u2014 Add a Bucket List date idea\n"
        "  _e.g. /idea Try the new sushi place downtown_\n\n"
        "/trip <dest/url> \u2014 Add a Dream Board destination\n"
        "  _e.g. /trip Tokyo_\n\n"
        "/generate \u2014 Create the optimized schedule!\n"
        "/today or /week \u2014 View your schedule\n"
        "/peek \u2014 See what the other user is doing\n"
        "/list \u2014 Show raw database items\n"
        "/reset \u2014 Wipe your schedule (keeps items)\n"
        "/journal \u2014 Send a private diary entry\n"
        f"/read{get_setting('user1_name', 'user1').replace(' ', '').lower()} \u2014 Read user1's journal\n"
        f"/list{get_setting('user1_name', 'user1').replace(' ', '').lower()} \u2014 See user1's raw items\n\n"
        "\U0001F4F8 **Memories**: Send a photo with a caption to add it to your dashboard!\n"
        "\U0001F4A1 _You can also just type naturally, e.g. 'We should go to Paris someday'_"
    )"""

import re
# Use regex to replace everything between "/goal <desc>" and the end of the help_text tuple
pattern = re.compile(r'"/goal <desc> \u2014 Add a flexible habit\\n".*?\)', re.DOTALL)
if pattern.search(content):
    content = pattern.sub(new_str.strip(), content)
    with open('backend/bot.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Injected help text")
else:
    print("Pattern not found!")
