
## 2024-05-27 - Fix arbitrary file upload in /api/memories/upload
**Vulnerability:** The `/api/memories/upload` endpoint in `backend/main.py` allowed users to upload files with any extension. This could lead to Arbitrary File Upload and Stored Cross-Site Scripting (XSS) if an attacker uploaded a malicious HTML or JS file and a user later viewed it.
**Learning:** File upload endpoints must always strictly validate file extensions against an allowlist. Relying solely on `os.path.splitext` without validation is insufficient.
**Prevention:** Implement an allowlist of valid file extensions and strictly enforce it before saving uploaded files to disk.
