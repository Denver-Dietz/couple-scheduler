## 2025-02-28 - Testing Error Handling in Caching Utils
**Learning:** Testing cached utility functions requires resetting module state or manually clearing cache variables. Testing multiple fetch calls inside a loop with early returns/continues requires conditionally mocking the fetch response based on URLs to accurately isolate specific file failures.
**Action:** Use `vi.resetModules()` in `beforeEach` combined with dynamic import of the module under test when caching at the module level to ensure independent test states.
