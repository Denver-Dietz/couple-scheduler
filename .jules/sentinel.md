## 2024-05-20 - Prevent Stored XSS and DoS in file uploads
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file extension and size, statically serving them. This allowed Stored XSS (e.g. uploading an HTML file) and Denial of Service (uploading extremely large files).
**Learning:** Even internal or simple upload endpoints must strictly validate file types against an allowlist and enforce size limits using `file.seek(0, 2)` before processing.
**Prevention:** Always use a strict extension allowlist aligned with frontend restrictions (e.g. `accept="image/*"`) and validate file size at the start of upload handlers to prevent resource exhaustion and XSS.
