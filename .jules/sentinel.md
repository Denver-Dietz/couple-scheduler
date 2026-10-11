
## 2024-10-11 - File Upload Vulnerabilities
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file extension and size, leading to potential Stored XSS (via `.svg` or `.html`) and Denial of Service (DoS) by filling up the disk.
**Learning:** It's critical to strictly validate both the extension and the size of uploaded files on the backend, rather than relying solely on frontend `accept` attributes.
**Prevention:** Always use an explicit allowlist for file extensions (e.g., `[".jpg", ".png"]`) and restrict file sizes using `file.file.seek(0, 2)` before processing uploads in FastAPI.
