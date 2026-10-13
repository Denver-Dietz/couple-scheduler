## 2026-10-13 - Unrestricted File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint allowed arbitrary file uploads and had no size restrictions, opening the system to Stored XSS via malicious HTML/SVG files and Denial of Service (DoS) through unbounded file sizes.
**Learning:** This existed because file input handling relied purely on the frontend `accept` attribute without server-side validation.
**Prevention:** Always enforce backend file size limits (using `seek(0, 2)`) and strict file extension allowlists (e.g. `{'.jpg', '.png'}`) for all file upload endpoints.
