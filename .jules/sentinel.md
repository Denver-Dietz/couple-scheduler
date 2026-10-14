## 2025-02-27 - Unrestricted File Upload in memory endpoint
**Vulnerability:** The `/api/memories/upload` endpoint saved uploaded files using the extension derived directly from `file.filename` without any validation against an allowlist, and had no size restrictions.
**Learning:** FastAPIs `UploadFile` does not automatically validate content types or file extensions. Relying solely on `os.path.splitext(file.filename)` allows arbitrary file uploads (like `.html` or `.php`) and lack of `seek()` size validation allows DoS via huge files.
**Prevention:** Always validate file extensions against a strict allowlist. Always enforce maximum file size limits by seeking to the end of the `UploadFile` object, reading the position, and seeking back to the beginning before processing.
