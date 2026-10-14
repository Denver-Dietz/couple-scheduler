## 2024-10-14 - Fix Unrestricted File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint saved arbitrary files directly to static files serving directory `/api/uploads/` with original extensions, lacking any size or extension restrictions. This leads to Stored XSS if HTML files are uploaded and DoS via large file uploads.
**Learning:** `os.path.splitext` alone doesn't prevent unsafe files. Serving these unvalidated files from a `StaticFiles` mount makes the application highly vulnerable to XSS and arbitrary payload hosting.
**Prevention:** Always validate file extensions against a strict allowlist (matching the frontend's `accept` attribute where applicable) and enforce strict file size limits using `seek()` or file headers before saving to the disk.
