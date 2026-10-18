## 2024-05-24 - Unrestricted File Upload Vulnerability
**Vulnerability:** The `/api/memories/upload` endpoint allowed uploading files of any type and size without validation.
**Learning:** Depending solely on `os.path.splitext` without validating the resulting extension allows arbitrary file uploads (like HTML/SVG files leading to Stored XSS). Unbounded file sizes expose the server to DoS attacks.
**Prevention:** Always validate file extensions against a strict allowlist and enforce maximum file sizes using `file.file.seek(0, 2)` before processing the upload, ensuring the file pointer is rewound immediately after.
