## 2025-02-28 - XSS via dangerouslySetInnerHTML
**Vulnerability:** Found unescaped user-controlled content injected into the Activity Feed UI using React's `dangerouslySetInnerHTML`. The string originated from database activities (goal titles, etc.) and was rendered without sanitization.
**Learning:** `dangerouslySetInnerHTML` is extremely risky when rendering dynamic content that originates from external sources or database tables containing user-provided strings.
**Prevention:** Always use a reputable library like `DOMPurify` to sanitize HTML output before passing it to `dangerouslySetInnerHTML` when standard React node interpolation (`{variable}`) cannot be used.
