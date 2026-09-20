💡 What: Added context-aware `aria-label` and `title` attributes to all icon-only buttons in the GoalList component (add/close form toggles, delete action buttons).

🎯 Why: Icon-only buttons without explicit labels are entirely opaque to screen reader users and confusing for mouse users who depend on hover contexts. Adding these attributes clarifies the buttons' purpose and state.

📸 Before/After: N/A - No visual changes.

♿ Accessibility: Significantly improved screen reader compatibility and mouse hover context by explicitly labeling the actions and the entities they affect (e.g. "Delete project X" instead of a blank button).
