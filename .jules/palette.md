## 2025-05-15 - Icon-Only Button Accessibility
**Learning:** Icon-only buttons (like `ChevronLeft`, `ChevronRight`, `X`, `Pencil`) strictly require an explicit textual alternative. Relying solely on the icon component fails WCAG standards for screen readers and leaves mouse users guessing the button's exact function.
**Action:** Always add both an `aria-label` attribute (for screen readers) and a `title` attribute (for native browser tooltips) to any interactive element that lacks text content.
