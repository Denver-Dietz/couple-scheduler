## 2024-05-24 - Insecure File Upload Handling
**Vulnerability:** The `/api/memories/upload` endpoint accepted arbitrary files and allowed any size without validation, which could lead to Stored XSS and Denial of Service (DoS) attacks.
**Learning:** Only extracting the file extension with `os.path.splitext` without validating it against an allowlist is insecure. Furthermore, reading files directly without enforcing size limits allows unbounded resource consumption.
**Prevention:** Always check uploaded file extensions against a strict allowlist. Limit file sizes explicitly, e.g., by using `file.file.seek(0, 2)` to read the total file size before processing.
