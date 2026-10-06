## 2025-02-21 - Fix Unrestricted File Upload in Memories

**Vulnerability:** The `/api/memories/upload` endpoint allowed uploading files of any type and unlimited size without validation.
**Learning:** The endpoint read the file extension and saved the file directly to disk, which is highly susceptible to Stored XSS if HTML/JS files are uploaded and served statically. Additionally, missing size limits can lead to Denial of Service (DoS) by filling the storage disk.
**Prevention:** Always validate file extensions against a strict allowlist. When streaming file uploads via FastAPI `UploadFile`, validate the file size by seeking to the end (`seek(0, 2)`), checking the size (`tell()`), and rewinding (`seek(0)`) before saving the file.
