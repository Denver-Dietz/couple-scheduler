## 2025-02-27 - [Fix Stored XSS in /api/memories/upload]
**Vulnerability:** The `/api/memories/upload` endpoint accepted and saved any file extension based on user input, allowing potential Stored XSS via HTML/JS files, or Server-Side script execution.
**Learning:** The previous implementation relied purely on extracting the file extension from `file.filename` using `os.path.splitext()` without enforcing any form of allowlist or validation.
**Prevention:** Always enforce a strict server-side allowlist for expected media extensions (e.g., `.jpg`, `.png`, `.mp4`) on file upload endpoints, completely rejecting invalid types with a 400 error rather than trying to sanitize them.
