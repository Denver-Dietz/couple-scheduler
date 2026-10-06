## 2024-10-06 - Unvalidated File Uploads Leading to Stored XSS
**Vulnerability:** The `/api/memories/upload` endpoint in `backend/main.py` saved uploaded files without validating their extensions, relying solely on `os.path.splitext()`.
**Learning:** This could allow attackers to upload malicious HTML or SVG files containing JavaScript, leading to Stored Cross-Site Scripting (XSS) when other users view the memory.
**Prevention:** Always use an allowlist of safe file extensions (e.g., `.jpg`, `.png`) for file uploads before saving them to disk.