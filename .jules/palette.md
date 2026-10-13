## 2023-10-24 - Accessibility improvements for RecapViewer controls
**Learning:** Icon-only buttons used for media controls (like Play/Pause, Mute/Unmute, and Close) within recap overlays often lack screen reader support and native tooltips, leaving assistive technologies unaware of their purpose or state.
**Action:** When building media controls or dynamic state buttons, consistently add dynamic `aria-label` attributes and `title` attributes that reflect the current state (e.g., "Mute audio" vs "Unmute audio") to ensure comprehensive accessibility.
