## 2024-09-24 - Unrestricted File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file extension and saved it directly to the filesystem.
**Learning:** This existed because the application blindly extracted the extension from `file.filename` using `os.path.splitext` and appended it to a UUID without validation. This could allow Stored XSS if HTML/SVG files were uploaded, or potentially remote code execution if executable files could be interpreted by the static file server.
**Prevention:** Always validate file extensions against a strict allowlist of expected file types (e.g., images and videos) before writing the file to disk. Raise a 400 Bad Request error for rejected files.
