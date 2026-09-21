🎯 **What:** Extracted the inner logic of `weekDates.map` in `WorkSchedulePanel.jsx` into a separate `DayScheduleCard` component.

💡 **Why:** This resolves the "Long function: dayShifts" code health issue. By separating the day schedule card logic into its own component, the code becomes more modular, readable, and easier to maintain. It reduces the nesting and complexity within the main `WorkSchedulePanel` component.

✅ **Verification:**
- Verified using `read_file` to ensure proper structure.
- Ran `pnpm build` successfully, ensuring no compilation errors.
- Visually verified using a Playwright script taking a screenshot of the app's schedule panel to ensure rendering matches original functionality without regression.

✨ **Result:** Improved separation of concerns, reduced length of the `weekDates.map` callback function, and better overall maintainability for `WorkSchedulePanel.jsx` without any functional changes.
