## 2024-10-24 - Unrestricted File Upload
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file type without extension validation and had no file size limits.
**Learning:** `UploadFile` in FastAPI does not restrict file types or sizes by default. `os.path.splitext` alone is insufficient without checking against an allowlist.
**Prevention:** Always validate file extensions against a strict allowlist matching frontend constraints, and check file sizes using `file.seek(0, 2)` and `tell()` (followed by `file.seek(0)`) before saving files.
