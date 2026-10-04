## 2024-10-04 - Unrestricted File Upload in Memory API
**Vulnerability:** The `/api/memories/upload` endpoint saved uploaded files without validating their extensions, allowing potential arbitrary file uploads or Stored XSS if someone uploaded an HTML or SVG file containing scripts.
**Learning:** `os.path.splitext` only extracts the extension; it provides no validation. Any filename provided by the client could be written directly to the server.
**Prevention:** Always validate file extensions against a strict allowlist (e.g., images and videos only) on the backend before writing any files to disk. Do not trust the client's provided extension blindly.
