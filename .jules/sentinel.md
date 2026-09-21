## 2024-05-18 - Overly permissive CORS origins
**Vulnerability:** CORS origins were set to allow all ('*'), which is overly permissive.
**Learning:** Hardcoding '*' for CORS in production setups opens the API to cross-origin requests from any domain, allowing potential CSRF-like attacks or unintended data exposure to malicious sites.
**Prevention:** Restrict CORS allow_origins to explicit domains, and use environment variables (e.g. CORS_ORIGINS) to manage them safely without hardcoding.
