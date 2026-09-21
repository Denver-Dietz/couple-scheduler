## 2025-02-14 - Refactoring Long Components
**Learning:** React components containing embedded complex logic functions degrade readability and violate separation of concerns.
**Action:** Always extract complex, state-independent utility functions (like custom sorting comparators) outside of the main React component body.
