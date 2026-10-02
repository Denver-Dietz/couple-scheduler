## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.

## 2024-10-02 - Icon-Only Button Navigation and Modals Pattern
**Learning:** Icon-only navigation buttons (like `ChevronLeft`/`ChevronRight` in calendars) and modal close buttons (`X`) frequently lack both `aria-label` (for screen readers) and `title` (for native tooltips for sighted users) across the app's components (e.g., MonthlyCalendar, GoalList, SleepSchedulePanel).
**Action:** Always add both `aria-label` and `title` to icon-only interactive elements to serve both assistive tech users and sighted users hovering for context.
