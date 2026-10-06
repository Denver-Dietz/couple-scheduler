## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.

## 2024-10-06 - Dynamic ARIA Labels for Stateful Icon Buttons
**Learning:** For icon-only buttons that toggle states (like Play/Pause or Mute/Unmute in media controls), static ARIA labels are insufficient. Screen readers need dynamic feedback to understand the current state and the action that will be performed.
**Action:** When working with state-toggling icon buttons, always apply dynamic `aria-label` (e.g., `aria-label={isPlaying ? "Pause" : "Play"}`), dynamic `title`, and `aria-pressed` attributes to ensure correct accessibility context.
