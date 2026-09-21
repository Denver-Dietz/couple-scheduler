## 2024-05-18 - Fix missing HTML escape before storage
**Vulnerability:** XSS vulnerability through user inputs saved directly in the SQLite database without sanitization (e.g., journal content, comment text, memory captions).
**Learning:** Raw input being passed into database parameters does not protect against XSS if the data is rendered raw on the frontend. The data must be sanitized when rendered, or explicitly escaped prior to DB storage if the frontend does not support auto-escaping.
**Prevention:** Always use `html.escape()` or `bleach` when inserting raw user text that will later be presented in HTML format. For modern frontends like React, sanitizing before DB limits raw data visibility but ensures safety from injection.
