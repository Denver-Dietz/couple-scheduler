## 2024-05-24 - File Upload Stored XSS
**Vulnerability:** The `/api/memories/upload` endpoint directly saved user-uploaded files to disk without validating the file extension, relying only on `os.path.splitext(file.filename)[1]`.
**Learning:** This could allow attackers to upload malicious files like `.html` or `.svg` containing JavaScript. Because the `uploads` directory is served statically (`app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR))`), navigating to the uploaded file's URL would execute the script in the context of the application (Stored XSS).
**Prevention:** Always validate uploaded file extensions against a strict allowlist (e.g., images/videos only) before saving them to disk.
