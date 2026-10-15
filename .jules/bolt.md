## 2023-10-15 - Concurrent Network Requests in React Effect
**Learning:** Sequential external API calls (e.g. weather, news, backend activity) in `useEffect` block the global component render until all are finished, making the UI appear unresponsive.
**Action:** Use `Promise.all()` to fire off all independent network requests concurrently inside `useEffect`, drastically reducing the total blocking wait time before updating the state.
