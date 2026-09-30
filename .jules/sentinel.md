## 2024-05-24 - Unrestricted File Upload in Memory Endpoint
**Vulnerability:** The `/api/memories/upload` endpoint accepted all file extensions and statically served the uploaded files, making the application vulnerable to Stored Cross-Site Scripting (XSS) if a user uploaded a malicious `.html` or `.svg` file.
**Learning:** We must not rely merely on extracting the extension; we must actively validate it against an explicit allowlist (like `.jpg`, `.png`).
**Prevention:** Always use an allowlist (e.g., `allowed_extensions = {".jpg", ".png", ".webp"}`) to validate file uploads before saving to disk.
