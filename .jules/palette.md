## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.
## 2024-05-24 - Accessibility Labels for Action Icons
**Learning:** Found several icon-only buttons (Trash, Close, Chevron) in GoalList, JournalView, MonthlyCalendar, SleepSchedulePanel, and WorkSchedulePanel that lacked `aria-label`s, creating a poor screen reader experience.
**Action:** When adding new interactive icons, always ensure they are wrapped in buttons with descriptive `aria-label` attributes.
