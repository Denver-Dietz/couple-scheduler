## 2024-05-18 - Unrestricted File Upload in Memories API
**Vulnerability:** The `/api/memories/upload` endpoint allowed uploading files with any extension (e.g., .html, .svg) which could lead to Stored Cross-Site Scripting (XSS) when served statically.
**Learning:** Relying solely on `os.path.splitext` without validating the resulting extension against an allowlist permits malicious file types to be saved and served.
**Prevention:** Always validate uploaded file extensions against a strict allowlist (e.g., image and video formats only) and reject unsupported files with a 400 Bad Request.
