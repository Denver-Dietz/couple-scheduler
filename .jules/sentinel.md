## 2026-09-22 - Fix Stored XSS vulnerability in file uploads
**Vulnerability:** The `/api/memories/upload` endpoint extracted file extensions from uploaded files without validating against an allowlist, permitting arbitrary files (e.g., `.html`, `.php`) to be uploaded and served statically.
**Learning:** Naively relying on `os.path.splitext` for extension extraction without checking the resulting extension allows bypassing intended media constraints, leading to severe vulnerabilities like Stored XSS when those files are served.
**Prevention:** Always implement strict server-side validation against an explicit allowlist of safe extensions (e.g., `.jpg`, `.png`) for any file upload endpoint.
