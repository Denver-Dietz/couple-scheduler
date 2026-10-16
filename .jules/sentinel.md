## 2024-10-16 - File Upload Vulnerability
**Vulnerability:** The `/api/memories/upload` endpoint accepted arbitrary files without validating the file extension or file size.
**Learning:** `os.path.splitext` alone is insufficient for file validation; attackers can exploit this to upload malicious files like HTML (Stored XSS) or executable files. Also, FastAPI does not automatically limit file sizes when reading streams, which can lead to Denial of Service via large uploads.
**Prevention:** Always validate file extensions against a strict allowlist. Limit file sizes explicitly using `file.file.seek(0, 2)` and `tell()` on `UploadFile` objects, ensuring the pointer is reset with `seek(0)` before saving.
