
## 2026-10-04 - Stored XSS via File Uploads
**Vulnerability:** The `/api/memories/upload` endpoint saved uploaded files (e.g., `.html`, `.svg`) directly to disk using the original file extension, allowing Stored XSS when these files were accessed via the static server.
**Learning:** Even if a file upload endpoint is for "memories" or images, if it trusts the user-provided file extension without validation, malicious scripts can be uploaded and executed by other users viewing the content.
**Prevention:** Always use a strict allowlist of safe extensions (e.g., `.jpg`, `.png`, `.mp4`) when saving user-uploaded files, reject disallowed files with HTTP 400, and normalize extensions (e.g., using `.lower()`).
