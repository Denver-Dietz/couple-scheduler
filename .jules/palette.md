## 2026-09-29 - Found Missing ARIA Labels Across Components
**Learning:** Multiple React components (JournalView, SleepSchedulePanel, WorkSchedulePanel, GoalList, MonthlyCalendar) use icon-only buttons (`<button><Trash2/></button>`, etc) without `aria-label` attributes, making them inaccessible to screen readers. This is a common pattern in this repository's design system.
**Action:** When adding or reviewing icon-only interactive elements in this codebase, always proactively verify that an `aria-label` or `aria-labelledby` attribute is present to provide context for screen readers.
