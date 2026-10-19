## 2024-10-19 - Unrestricted File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint allowed uploading files with any extension and without size limits, enabling Stored XSS (e.g., uploading and executing `.html` via StaticFiles) and Denial of Service (resource exhaustion).
**Learning:** `os.path.splitext` extracts the extension but does not validate it. The `StaticFiles` middleware relies on extensions to set the `Content-Type` header, meaning uncontrolled extensions bypass security assumptions.
**Prevention:** Always validate file extensions against a strict allowlist. Additionally, strictly enforce a maximum file size using `file.seek(0, 2)` and `file.tell()` (and resetting the pointer with `seek(0)`) before reading or saving the file.
