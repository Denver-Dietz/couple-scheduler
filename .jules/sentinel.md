## 2024-10-17 - Unrestricted File Upload Vulnerability
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file extension and size, relying only on frontend validation (`accept="image/*"`).
**Learning:** Relying solely on `os.path.splitext` without validating the extension or checking file size allows attackers to bypass frontend restrictions, potentially uploading malicious scripts (Stored XSS) or causing DoS via large files.
**Prevention:** Always validate file extensions against a strict allowlist on the backend and enforce maximum file sizes by checking `file.file.seek(0, 2)` and `tell()` (followed by `seek(0)`) before processing the upload.
