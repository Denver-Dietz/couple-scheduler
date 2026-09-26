
## 2024-05-27 - Stored XSS in File Upload Endpoint
**Vulnerability:** The `/api/memories/upload` endpoint saved uploaded files using their original extension (`os.path.splitext`) without validation, allowing malicious files like `.html` or `.svg` to be uploaded and served statically. This lead to a Stored XSS vulnerability.
**Learning:** File upload endpoints must explicitly validate file extensions against a strict allowlist. Relying solely on the original file name/extension is insecure.
**Prevention:** Implement server-side validation using a strict extension allowlist (e.g., `ALLOWED_EXTENSIONS = {'.jpg', '.png'}`). Also verify MIME types and consider sanitizing file contents if necessary.
