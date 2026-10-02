## 2024-05-20 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons (like those using `lucide-react` icons such as `ThumbsUp`, `ThumbsDown`, `Trash2`, `Plus`, `ArrowRight`) lacked accessibility context for screen readers. Using simple `aria-label`s significantly improves UX for assistive technologies.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` or visually hidden text is provided. Look for instances of `btn-outline` or `btn-primary` with just an icon inside.

## 2024-10-02 - Dynamic Stateful ARIA Labels
**Learning:** Icon-only buttons that change state (e.g., Play/Pause, Mute/Unmute) require dynamic `aria-label`s to properly announce their current action context to screen readers, rather than just static labels. For example, a mute button needs to change from "Mute audio" to "Unmute audio" when clicked.
**Action:** When working with toggleable icon-only buttons, always ensure the `aria-label` and `title` attributes are updated dynamically based on the component's state (e.g., `aria-label={isPlaying ? "Pause recap" : "Play recap"}`).
