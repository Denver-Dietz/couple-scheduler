🧹 [Refactor handleLogin to inline fetchTheme logic]

🎯 What:
The `handleLogin` function in `frontend/src/App.jsx` contained an unnecessarily nested `fetchTheme` function. This nested function has been removed, and its logic has been inlined directly into `handleLogin`.

💡 Why:
Refactoring the long function to execute logic directly instead of defining and immediately calling a nested function improves code readability and maintainability. It simplifies the asynchronous control flow and reduces unnecessary complexity.

✅ Verification:
Compiled the frontend using `pnpm build` to confirm syntax validity. Verified there were no structural breaks and that the `App.jsx` component behaves as expected without any race conditions caused by the nested async call.

✨ Result:
A cleaner, more readable `handleLogin` function without unnecessary inner function declarations.
