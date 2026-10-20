
## 2024-10-20 - [File Upload Vulnerability]
**Vulnerability:** Unrestricted file upload and missing file size limit in `/api/memories/upload`.
**Learning:** Missing extension and size validation can lead to Stored XSS, Remote Code Execution (if uploaded scripts are executed), and Denial of Service (DoS). The frontend `accept` attribute is not sufficient protection.
**Prevention:** Always validate file extensions against a strict allowlist on the backend and enforce maximum file size limits using `file.file.seek()` and `tell()`.
