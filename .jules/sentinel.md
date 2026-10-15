## 2024-10-15 - Insecure File Upload / Missing Validation
**Vulnerability:** The `/api/memories/upload` endpoint lacked validation for file extensions and file sizes, allowing arbitrary file uploads (Stored XSS risk via `.html`/`.svg`) and excessively large files (DoS risk).
**Learning:** Relying purely on the frontend's `accept="image/*"` attribute is insufficient because the backend must enforce its own constraints. Unvalidated file extensions can be exploited when served statically.
**Prevention:** Always validate file extensions against a strict allowlist on the backend and enforce maximum file sizes using `file.file.seek(0, 2)` before processing or saving the file.
