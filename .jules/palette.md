## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.
## 2024-05-18 - Missing ARIA Labels on Icon Buttons
**Learning:** Icon-only buttons (like Calendar chevrons) and dynamic toggles frequently miss `aria-label` and `aria-pressed` attributes.
**Action:** Always add `aria-label` and `title` to icon-only buttons, and `aria-pressed={boolean}` for state toggles.
