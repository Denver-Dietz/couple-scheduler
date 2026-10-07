## 2024-10-24 - Unrestricted File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint allowed uploading files of any type and size, leading to Stored XSS and DoS risks.
**Learning:** Relying solely on `os.path.splitext` without validating the extension or checking file size leaves static file mounts vulnerable.
**Prevention:** Always use an explicit allowlist for file extensions and enforce strict maximum file sizes using `seek(0, 2)` before saving.
