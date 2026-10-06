## 2026-10-06 - Unrestricted File Upload
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file extension and file size, leading to a Stored XSS and DoS risk.
**Learning:** Always validate file extensions and sizes server-side. Relying solely on `os.path.splitext` without an allowlist is insufficient.
**Prevention:** Enforce a maximum file size using `file.file.seek(0, 2)` and validate extensions against a strict allowlist.
