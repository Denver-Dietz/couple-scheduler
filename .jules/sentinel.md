
## 2024-05-01 - Fix Unrestricted File Upload Vulnerability
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file extension and size, creating a Stored XSS vulnerability and a potential DoS vector.
**Learning:** Always validate both the file extension against a strict allowlist and enforce maximum size limits on server-side file uploads, regardless of client-side validation.
**Prevention:** Implement server-side checks for file type and size using `file.file.seek` for size calculation and checking the extension against a defined set.
