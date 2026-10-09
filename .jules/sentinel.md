## 2023-10-09 - Unrestricted File Upload in Memories
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file type without validation, allowing Stored XSS (e.g., via HTML/SVG) and potentially DoS due to unrestricted file sizes.
**Learning:** Using `os.path.splitext(file.filename)[1]` without checking against an allowlist and not validating `file.file.seek(0, 2)` leaves the server open to malicious files.
**Prevention:** Always strictly validate file extensions against an allowlist (e.g., `.jpg`, `.png`) and enforce a maximum file size using `seek` and `tell` for all uploaded files.
