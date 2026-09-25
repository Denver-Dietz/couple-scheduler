## 2024-05-20 - Stored XSS via File Upload Extension
**Vulnerability:** The `/api/memories/upload` endpoint blindly extracted file extensions using `os.path.splitext()` without validation against an allowlist, allowing dangerous extensions like `.html`, `.js`, or `.svg` to be uploaded and served from static file directories.
**Learning:** Even if files are renamed via UUID, allowing browsers to render unsanitized content by trusting the user-provided file extension creates severe Stored XSS vectors in static-file serving setups.
**Prevention:** Always enforce an explicit extension allowlist (e.g. `{"jpg", "png", "webp"}`) and consider deeper file-type validation (magic numbers/MIME type inspection) for public-facing media upload endpoints.
