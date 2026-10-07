## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.
## 2024-10-07 - Add ARIA Labels to Monthly Calendar Buttons
**Learning:** The monthly calendar component relies heavily on icon-only buttons for navigation (previous/next month) and closing modals. Adding `aria-label` and `title` to these elements provides essential context for screen readers and tooltips for mouse users without altering the visual design.
**Action:** Ensure all navigation and modal close actions represented purely by icons (like `<ChevronLeft />`, `<ChevronRight />`, and `<X />`) have descriptive `aria-label` and `title` attributes.
