## 2024-05-24 - GoalList Accessible Buttons & Confirmation
**Learning:** Icon-only toggle buttons and inline delete actions in list components (like GoalList) lack context for screen reader users and present a risk of accidental data loss without confirmation steps.
**Action:** Always verify that state-toggling buttons and inputs have dynamic `aria-label`s based on their current state, and integrate `window.confirm` or similar dialogs before executing destructive API calls.
