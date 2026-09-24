## 2026-09-24 - [Unrestricted File Upload in Memory API]
**Vulnerability:** The `/api/memories/upload` endpoint used the provided filename to determine the extension for the saved file on disk and its corresponding URL (`storage_url`), but it failed to validate the extension against a safelist.
**Learning:** This could allow an attacker to upload arbitrary files (e.g. HTML files containing XSS payloads) which would be served statically under the `/api/uploads/` path.
**Prevention:** Implemented a strict allowlist of allowed extensions (e.g. `.jpg`, `.png`, `.mp4`) and returned a 400 Bad Request error for any unrecognized or malicious file types, preventing potentially dangerous content from being stored or served.
