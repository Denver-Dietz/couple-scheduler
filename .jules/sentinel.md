## 2026-10-12 - Fix Arbitrary File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file extension and size, writing the file directly to the disk without validation.
**Learning:** This could lead to Stored XSS (if `.html` or `.svg` was uploaded), arbitrary code execution (if it was a `.php` file served via PHP enabled server), or DoS via massive file uploads. Validating user input using the exact requirements on the frontend (`image/*`) is necessary on the backend too.
**Prevention:** Always validate file extensions against a strict allowlist. Always check file size limits (e.g. by seeking to the end or reading chunks) to prevent DoS.
