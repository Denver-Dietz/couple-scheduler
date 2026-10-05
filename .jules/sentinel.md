## 2023-10-05 - File Upload Allowlist
**Vulnerability:** File upload endpoint (`/api/memories/upload`) accepted any file extension.
**Learning:** This is a Stored XSS vulnerability risk if HTML or SVG files are uploaded.
**Prevention:** Enforce a strict allowlist of allowed extensions for all uploaded files.
