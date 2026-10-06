
## 2024-05-27 - Unrestricted File Upload Vulnerability
**Vulnerability:** The `/api/memories/upload` endpoint saved files using user-controlled extensions without validation and without size limits.
**Learning:** This could lead to Stored XSS (if an HTML/JS file was uploaded and served) or Denial of Service (if excessively large files were uploaded to exhaust storage).
**Prevention:** Always validate file extensions using a strict allowlist (e.g., `ALLOWED_EXTENSIONS = {'.jpg', '.png', ...}`) and enforce a reasonable `MAX_FILE_SIZE` directly in the upload endpoint handler before processing or saving the file.
