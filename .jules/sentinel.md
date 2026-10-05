## 2024-10-05 - Stored XSS via File Upload
**Vulnerability:** The `/api/memories/upload` endpoint saved and statically served uploaded files using the user-provided filename extension without validation, allowing Stored XSS (e.g., uploading an `.html` or `.svg` file).
**Learning:** Relying solely on `os.path.splitext` for file extension extraction without verifying it against an allowlist introduces significant security risks, especially when those files are subsequently served directly by the backend to other users.
**Prevention:** Always validate file extensions (and ideally MIME types/file signatures) against a strict allowlist of expected types (e.g., images and videos) before saving and serving them.
