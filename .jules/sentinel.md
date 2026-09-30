## 2024-09-30 - Fix Stored XSS in memory file upload
**Vulnerability:** The `/api/memories/upload` endpoint accepted any file extension without validation, allowing the upload of malicious executable files like HTML, SVG, or shell scripts.
**Learning:** Serving unrestricted user-uploaded files statically can lead to Stored XSS or session takeover if an HTML/SVG file containing malicious scripts is requested. Always enforce an explicit allowlist of expected file extensions.
**Prevention:** Use an explicit allowlist (e.g., `ALLOWED_EXTENSIONS`) to strictly filter file extensions before saving and serving uploaded user content.
