## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.
## 2024-10-28 - Dynamic ARIA labels for Toggle Buttons
**Learning:** Icon-only buttons used for toggling forms (e.g., `<Plus/>` vs `<X/>`) in this app's design system need their `aria-label` updated dynamically based on component state to ensure screen readers announce the correct action (e.g., "Add goal" vs "Cancel adding goal"), not just a static label.
**Action:** When adding ARIA labels to toggle buttons that swap icons based on state, always use ternary operators in the `aria-label` attribute corresponding to the visual state change.
