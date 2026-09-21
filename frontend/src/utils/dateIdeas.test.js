import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create a variable to capture the mock functions so we can clear them
const fetchMock = vi.fn();

// In Vitest, to reset module-level variables between tests, we can use
// vi.resetModules() before importing, but the easiest way is to mock fetch
// and test the cache behavior sequentially in one test or use import()

describe('fetchDateIdeas', () => {
  const originalConsoleError = console.error;
  let fetchDateIdeas;

  beforeEach(async () => {
    vi.stubGlobal('fetch', fetchMock);
    console.error = vi.fn();

    // Clear module registry to reset `cachedDateData` in dateIdeas.js
    vi.resetModules();

    // Dynamically import the module so we get a fresh state
    const module = await import('./dateIdeas.js?t=' + Date.now());
    fetchDateIdeas = module.fetchDateIdeas;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    console.error = originalConsoleError;
  });

  it('successfully fetches and aggregates date ideas', async () => {
    // Mock successful fetch responses
    fetchMock.mockImplementation((url) => {
      let data = {};

      if (url.includes('dates_active_outdoors.json')) {
        data = {
          theme: 'Active Outdoors',
          description: 'Fun outdoor activities',
          ideas: [
            { id: 1, title: 'Hiking', cost: '$' }
          ]
        };
      } else if (url.includes('dates_cozy_athome.json')) {
        data = {
          theme: 'Cozy At Home',
          description: 'Relaxing dates at home',
          ideas: [
            { id: 2, title: 'Movie Night', cost: 'Free' },
            { id: 3, title: 'Cooking Together', cost: '$$' }
          ]
        };
      } else {
        // Mock a 404 for other files to ensure we handle it
        return Promise.resolve({
          ok: false,
          status: 404
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data)
      });
    });

    const result = await fetchDateIdeas();

    expect(fetchMock).toHaveBeenCalledTimes(10); // 10 JSON files defined in dateIdeas.js

    expect(result).toHaveProperty('themes');
    expect(result).toHaveProperty('ideas');

    expect(result.themes).toHaveLength(2);
    expect(result.themes[0]).toEqual({
      theme: 'Active Outdoors',
      description: 'Fun outdoor activities',
      filename: 'dates_active_outdoors.json'
    });

    expect(result.ideas).toHaveLength(3);
    expect(result.ideas[0]).toEqual({
      id: 1,
      title: 'Hiking',
      cost: '$',
      theme: 'Active Outdoors',
      filename: 'dates_active_outdoors.json'
    });

    expect(result.ideas[1]).toEqual({
      id: 2,
      title: 'Movie Night',
      cost: 'Free',
      theme: 'Cozy At Home',
      filename: 'dates_cozy_athome.json'
    });
  });

  it('handles fetch errors gracefully', async () => {
    // Mock fetch to throw an error for the first file and succeed for the rest
    fetchMock.mockImplementation((url) => {
      if (url.includes('dates_active_outdoors.json')) {
        return Promise.reject(new Error('Network error'));
      }

      return Promise.resolve({
        ok: false,
        status: 404
      });
    });

    const result = await fetchDateIdeas();

    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(console.error).toHaveBeenCalledWith(
      'Failed to load date idea file:',
      'dates_active_outdoors.json',
      expect.any(Error)
    );

    expect(result.themes).toHaveLength(0);
    expect(result.ideas).toHaveLength(0);
  });

  it('returns cached data on subsequent calls', async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          theme: 'Test',
          description: 'Desc',
          ideas: [{ id: 1, title: 'Idea' }]
        })
      });
    });

    // First call should trigger fetch
    const firstResult = await fetchDateIdeas();
    expect(fetchMock).toHaveBeenCalledTimes(10);

    // Clear mock to check if it gets called again
    fetchMock.mockClear();

    // Second call should return cached data without fetching
    const secondResult = await fetchDateIdeas();
    expect(fetchMock).not.toHaveBeenCalled();

    // The results should be exactly the same object reference (cached)
    expect(firstResult).toBe(secondResult);
  });
});
