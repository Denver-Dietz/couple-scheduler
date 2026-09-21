🔒 Fix Unrestricted File Upload vulnerability in Memories API

🎯 **What:** The vulnerability fixed was an unrestricted file upload issue where any file type (e.g., .html, .php) could be uploaded and saved to the backend.

⚠️ **Risk:** Since these files are served statically, a malicious user could upload an HTML file with executable JavaScript. When viewed by a user, this could lead to Stored Cross-Site Scripting (XSS), compromising user data, hijacking sessions, or taking actions on the victim's behalf.

🛡️ **Solution:** Added validation to verify the file extension against a whitelist of safe image and video formats (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.mp4`, `.mov`). If an invalid extension is detected, the API now returns a 400 Bad Request error. I also added test cases to ensure that valid files are uploaded successfully and malicious files are appropriately rejected.
