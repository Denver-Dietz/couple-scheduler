
## 2024-05-24 - Stored XSS via Arbitrary File Upload in Memories Endpoint
**Vulnerability:** The `/api/memories/upload` endpoint accepted user-uploaded files without validating the file extension, relying solely on `os.path.splitext` to determine the saved extension. This allowed an attacker to upload files with extensions like `.html` or `.svg` containing malicious JavaScript. Since the files were served via FastAPI's `StaticFiles`, the malicious payload would execute in a user's browser, leading to Stored XSS.
**Learning:** Never trust the client-provided file extension or content type when allowing file uploads, especially when serving them from the same origin.
**Prevention:** Implement a strict server-side allowlist for file extensions (e.g., `.png`, `.jpg`, `.mp4`) and reject any upload that does not match. Additionally, validate the MIME type and consider serving user-uploaded files from a separate, isolated domain.
