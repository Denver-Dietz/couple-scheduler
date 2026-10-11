## 2026-10-11 - File Upload Vulnerability
**Vulnerability:** Unrestricted file upload in `/api/memories/upload` endpoint allowing arbitrary file extensions and unlimited file sizes.
**Learning:** Relied only on frontend `accept="image/*"` without enforcing backend validation. This creates a risk for Stored XSS and DoS.
**Prevention:** Always validate file extension against an allowlist and check file size using `file.seek` on the backend before writing.
