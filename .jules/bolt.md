## 2024-09-22 - Path Traversal via Filename Extension
**Learning:** `os.path.splitext(file.filename)` can extract an extension that includes directories (e.g. `file.ext/foo.bar` -> `.bar`, but if it contains path characters, it could be used for traversal).
**Action:** When saving a file and deriving the filename using just a generated ID and the user's uploaded file extension, sanitize the extracted file extension by allowing only expected characters (e.g., `re.sub(r'[^a-zA-Z0-9.]', '', ext)`).
