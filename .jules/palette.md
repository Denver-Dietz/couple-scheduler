## 2023-10-27 - Icon-only buttons missing ARIA labels
**Learning:** Many icon-only buttons across the frontend components (e.g., SleepSchedulePanel, WorkSchedulePanel) are missing `aria-label` attributes, making them inaccessible to screen readers.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` is present to describe the action (e.g., "Delete sleep schedule", "Close form").
