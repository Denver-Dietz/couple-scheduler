## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.
## 2026-10-05 - Missing ARIA labels and tooltips on icon-only action buttons
**Learning:** Icon-only action buttons (like toggle forms or delete items) in list views frequently lack `aria-label`, `title`, and `aria-expanded` attributes, hurting screen reader usability and discoverability.
**Action:** When working on list components, always verify and add dynamic `aria-label` and `title` attributes to icon-only buttons, especially those that toggle state or trigger destructive actions.
