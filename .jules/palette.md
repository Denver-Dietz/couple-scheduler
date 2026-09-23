## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.
## 2024-05-19 - Dynamic ARIA labels for icon-only buttons
**Learning:** Icon-only buttons whose function changes based on state (e.g. play/pause, mute/unmute) must have their `aria-label` updated dynamically to match the current visual icon being displayed, otherwise screen reader users won't know the button's action has changed.
**Action:** When adding `aria-label` to state-dependent icon-only buttons, use a ternary operator or similar logic to map the label to the current state (e.g., `aria-label={isPlaying ? "Pause video" : "Play video"}`).
