## 2024-10-18 - Unrestricted File Upload Vulnerability
**Vulnerability:** The `/api/memories/upload` endpoint accepts any file extension and any file size, storing them directly and serving them via `StaticFiles`. This leads to Stored XSS (by uploading HTML/JS files) and DoS (by uploading massive files).
**Learning:** Relying solely on `os.path.splitext` without an explicit allowlist and missing size constraints exposes the backend to severe exploitation, especially when files are served directly without a Content-Disposition header.
**Prevention:** Always validate file extensions against a strict allowlist aligned with frontend restrictions (e.g., `image/*`), and enforce maximum file sizes by checking the actual file size (e.g., using `file.file.seek(0, 2)` and `tell()`) before saving.
