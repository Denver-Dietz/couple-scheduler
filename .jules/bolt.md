## 2024-10-06 - Refactor database initialization

**Learning:** Large monolithic database initialization scripts containing dozens of `CREATE TABLE` strings are hard to maintain and read. Furthermore, grouping multiple `ALTER TABLE` statements inside a single `try/except` block introduces bugs where later columns fail to be added if earlier columns already exist.
**Action:** Always extract database schemas into `.sql` files and load them via `executescript`. Ensure every schema migration step (like adding a column) is evaluated individually so failures are caught and handled granularly.
