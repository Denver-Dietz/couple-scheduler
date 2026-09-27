## 2024-05-18 - Stored XSS via File Upload Validation
**Vulnerability:** Unrestricted File Upload in `/api/memories/upload`. The application relied solely on `os.path.splitext(file.filename)[1]` without validating the extension against an allowlist, meaning `.html` or other executable scripts could be uploaded and served from static files.
**Learning:** Python's `os.path.splitext` is not a validation mechanism; it merely extracts strings. Assuming all frontend-submitted files match their expected types is a dangerous pattern in file upload components.
**Prevention:** Always enforce a strict allowlist of allowed MIME types and file extensions (e.g., `[".jpg", ".png", ".webp"]`) *before* saving any user-uploaded files to the static storage directory.
