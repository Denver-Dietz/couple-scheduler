## 2024-10-18 - File Upload Extension Validation
**Vulnerability:** The `/api/memories/upload` endpoint was only extracting the file extension and appending it directly to the UUID filename without validation (`os.path.splitext(file.filename)[1]`). This meant an attacker could upload `.html`, `.svg`, or `.php` files, leading to Stored XSS when served back to users.
**Learning:** It's not enough to randomize the file name (UUID) and avoid Path Traversal. The raw unvalidated user-provided extension must also be verified against a strict allowlist to prevent execution/rendering vulnerabilities.
**Prevention:** Always validate `file_ext` against a hardcoded set of acceptable image/video formats (e.g., `ALLOWED_EXTENSIONS = {'.jpg', '.png', '.mp4'}`) before saving any files locally.
