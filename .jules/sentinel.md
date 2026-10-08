## 2024-10-24 - File Upload Vulnerability
**Vulnerability:** Arbitrary file upload and missing file size limits on the `/api/memories/upload` endpoint.
**Learning:** Relying solely on `os.path.splitext` without an allowlist enables malicious file uploads (e.g., HTML for Stored XSS), and lacking size checks introduces DoS risks.
**Prevention:** Always validate file extensions against a strict allowlist and enforce maximum file sizes (e.g., using `file.seek(0, 2)`) before saving.
