## 2026-10-09 - Accessible Icon-only Expanders
**Learning:** Found a pattern across dashboard components where icon-only toggle buttons for forms (like those in GoalList) completely lack ARIA attributes (`aria-label`, `aria-expanded`), making them invisible/unclear to screen reader users and missing helpful native tooltips for sighted users.
**Action:** When adding expandable forms or list items with inline actions, always ensure icon-only buttons have descriptive `aria-label`, `title`, and appropriate state bindings like `aria-expanded={isOpen}`.
