## 2023-10-27 - Icon-only buttons missing ARIA labels
**Learning:** Many icon-only buttons across the frontend components (e.g., SleepSchedulePanel, WorkSchedulePanel) are missing `aria-label` attributes, making them inaccessible to screen readers.
**Action:** When adding or reviewing icon-only buttons, always ensure an `aria-label` is present to describe the action (e.g., "Delete sleep schedule", "Close form").

## 2023-10-27 - Widespread missing ARIA labels on utility icons
**Learning:** The pattern of missing ARIA labels on icon-only buttons extends deeply into nested components like the `TripPlanner` panels (Wishlist, Logistics, Itinerary, Budget).
**Action:** When implementing any list manipulation (add, delete, reorder, vote) that uses icons without text, it is critical to explicitly add `aria-label` attributes to ensure keyboard and screen reader accessibility for all interactive items.

## 2023-10-27 - Input fields missing associated labels
**Learning:** Many input fields, especially those used in inline forms (like TripPlanner add forms or GoalList forms), lack associated `<label>` elements or `aria-label` attributes. This makes it difficult for screen reader users to understand the purpose of the input field. Placeholder text is not a sufficient replacement for a label.
**Action:** When creating input fields that do not have a visible, programmatically associated `<label>` element, always provide a descriptive `aria-label` attribute.
