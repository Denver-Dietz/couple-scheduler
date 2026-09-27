## 2024-05-18 - Unrestricted File Upload
**Vulnerability:** The `/api/memories/upload` endpoint allowed uploading files without validating their extension.
**Learning:** Relying solely on `os.path.splitext` without validating the resulting extension allows for Stored XSS vulnerabilities via malicious file uploads (e.g. .html or .svg files).
**Prevention:** Implement a strict allowlist of file extensions (e.g., .jpg, .png, .webp) before accepting the uploaded file.
