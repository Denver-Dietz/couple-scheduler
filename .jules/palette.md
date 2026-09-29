## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.
## 2024-05-14 - Add ARIA Labels to Icon-Only Utility Buttons
**Learning:** In this application's components (e.g., calendars, panels), interactive utility buttons (such as edit, delete, and close) are often represented entirely by icons (from `lucide-react`) without accompanying text. Without explicit `aria-label` attributes, these buttons are inaccessible to screen reader users, who receive no context about their function.
**Action:** When implementing or modifying icon-only utility buttons, ensure they have descriptive `aria-label` attributes (e.g., `aria-label="Delete work shift"`) to provide parity with text-labeled buttons.
