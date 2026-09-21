## 2024-10-24 - SQL Injection Prevention via Strict Input Validation
**Learning:** Found a vulnerability where column names were derived from user input in `vote_wishlist_item` and formatted dynamically into a SQL string. Though restricted by an inline `if/else`, building queries dynamically is generally unsafe and flagged by security scanners.
**Action:** When determining which column to update based on user input, strictly validate the input and use distinct, explicit query strings rather than conditionally formatting the column into a single query string.
