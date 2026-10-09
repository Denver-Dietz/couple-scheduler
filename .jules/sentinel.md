## 2024-05-24 - Unrestricted File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file type without extension or size validation, creating risks for Stored XSS and Denial of Service.
**Learning:** Relying solely on `os.path.splitext` for file processing without an explicit allowlist and size check leaves the upload directory open to malicious files.
**Prevention:** Always validate file extensions against a strict allowlist and enforce maximum file sizes (e.g., using `file.seek(0, 2)`) before saving uploaded content.
