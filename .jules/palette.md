## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.

## 2024-10-01 - Icon-only Buttons Accessibility
**Learning:** Many interactive icon-only buttons (like delete, edit, or close) throughout the application lacked native tooltips or screen reader labels, causing ambiguity.
**Action:** Always add `aria-label` (for screen readers) and `title` (for native tooltips for sighted users) to all icon-only buttons.
