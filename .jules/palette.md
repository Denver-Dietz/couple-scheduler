## 2026-09-28 - Dynamic ARIA labels for mapping blocks
**Learning:** When applying ARIA labels to dynamically mapped lists (like appointments, goals, and projects in `GoalList.jsx`), it's crucial to first verify the exact variable names (e.g., `c.title`, `g.title`, `p.title`) used to render the item titles within the mapping block context before writing the code, as guessing can lead to undefined variables.
**Action:** Always use commands like `grep -A 10 "map("` to explicitly confirm the mapping variables and their properties before proposing or implementing dynamic ARIA label strings.
