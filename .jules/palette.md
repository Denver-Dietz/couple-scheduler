## 2024-10-24 - Journal View Icon Buttons
**Learning:** Icon-only buttons in complex lists (like the journal entries feed) frequently miss contextual `aria-label`s because developers rely only on visual icons or tooltip titles, which causes screen-reader ambiguity and hurts accessibility. Adding `title` isn't enough, and adding `aria-label` without `title` misses a native hover tooltip.
**Action:** Always add both `aria-label` and `title` attributes to icon-only buttons (like Edit, Delete, Reaction, Close modals) to ensure both screen readers and sighted users have proper context.
