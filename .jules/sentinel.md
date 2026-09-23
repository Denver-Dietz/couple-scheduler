## 2025-01-20 - Unrestricted File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file type and saved it to the static uploads directory (`/api/uploads`).
**Learning:** The endpoint relied solely on extracting the file extension without validating it, allowing potential Stored XSS via malicious `.html` or `.svg` files containing JavaScript, or potentially RCE if the static directory had executable permissions and server execution was enabled.
**Prevention:** Implement strict file extension validation using an allowlist (e.g., `ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}`) before saving user-uploaded files, especially in directories served statically.
