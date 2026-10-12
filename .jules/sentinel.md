
## 2024-05-24 - File Upload Stored XSS and DoS
**Vulnerability:** The `/api/memories/upload` endpoint allowed arbitrary file types and unlimited file sizes, leading to Stored XSS and DoS risks.
**Learning:** Relying only on frontend `accept="image/*"` restrictions is unsafe. File uploads must be strictly validated server-side.
**Prevention:** Always use an explicit allowlist for file extensions and enforce max file size limits via `file.file.seek(0, 2)` and `tell()` before saving.
