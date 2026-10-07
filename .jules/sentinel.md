## 2024-07-25 - Fix Insecure File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint allowed arbitrary file uploads (Stored XSS) and unbounded file sizes (DoS).
**Learning:** Relying solely on `os.path.splitext` without an allowlist or size constraint allows malicious users to execute code in the context of the application's domain or exhaust server storage.
**Prevention:** Always validate file extensions against a strict allowlist and enforce maximum file sizes (e.g., using `file.file.seek(0, 2)`) before writing uploaded files to disk.
