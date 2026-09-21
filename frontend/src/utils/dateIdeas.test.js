import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('fetchDateIdeas', () => {
  let fetchDateIdeas;

  beforeEach(async () => {
    // Reset modules to clear cachedDateData
    vi.resetModules();

    // Setup fetch mock
    global.fetch = vi.fn();

    // Import the module fresh for each test so cachedDateData is reset
    const module = await import('./dateIdeas.js');
    fetchDateIdeas = module.fetchDateIdeas;

    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles fetch rejections and continues processing other files', async () => {
    global.fetch.mockImplementation(async (url) => {
      if (url.includes('dates_active_outdoors.json')) {
        return Promise.reject(new Error('Network error'));
      }

      // For all other files, return a mock successful response
      return {
        ok: true,
        json: async () => ({
          theme: 'Mock Theme',
          description: 'Mock Description',
          ideas: [{ title: 'Mock Idea' }]
        })
      };
    });

    const result = await fetchDateIdeas();

    // The first file failed, but there are 9 other files.
    // Each successful file returns 1 theme and 1 idea.
    expect(result.themes.length).toBe(9);
    expect(result.ideas.length).toBe(9);

    // Verify console.error was called for the failed fetch
    expect(console.error).toHaveBeenCalledWith(
      "Failed to load date idea file:",
      'dates_active_outdoors.json',
      expect.any(Error)
    );
  });

  it('handles JSON parsing errors and continues processing other files', async () => {
    global.fetch.mockImplementation(async (url) => {
      if (url.includes('dates_adventurous_thrill.json')) {
        return {
          ok: true,
          json: async () => { throw new Error('Invalid JSON'); }
        };
      }

      // For all other files, return a mock successful response
      return {
        ok: true,
        json: async () => ({
          theme: 'Mock Theme',
          description: 'Mock Description',
          ideas: [{ title: 'Mock Idea' }]
        })
      };
    });

    const result = await fetchDateIdeas();

    // The second file failed parsing, but there are 9 other successful files.
    expect(result.themes.length).toBe(9);
    expect(result.ideas.length).toBe(9);

    expect(console.error).toHaveBeenCalledWith(
      "Failed to load date idea file:",
      'dates_adventurous_thrill.json',
      expect.any(Error)
    );
  });

  it('handles non-ok responses by skipping and continuing processing', async () => {
    global.fetch.mockImplementation(async (url) => {
      if (url.includes('dates_art_culture.json')) {
        return {
          ok: false,
          status: 404
        };
      }

      // For all other files, return a mock successful response
      return {
        ok: true,
        json: async () => ({
          theme: 'Mock Theme',
          description: 'Mock Description',
          ideas: [{ title: 'Mock Idea' }]
        })
      };
    });

    const result = await fetchDateIdeas();

    // The third file returned 404, but there are 9 other successful files.
    expect(result.themes.length).toBe(9);
    expect(result.ideas.length).toBe(9);

    // console.error shouldn't be called because !response.ok just continues
    expect(console.error).not.toHaveBeenCalled();
  });

  it('uses cached data on subsequent calls', async () => {
    global.fetch.mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({
          theme: 'Mock Theme',
          description: 'Mock Description',
          ideas: [{ title: 'Mock Idea' }]
        })
      };
    });

    const firstResult = await fetchDateIdeas();
    expect(global.fetch).toHaveBeenCalledTimes(10); // 10 JSON files

    // Reset call count
    global.fetch.mockClear();

    const secondResult = await fetchDateIdeas();

    // Fetch should not be called again
    expect(global.fetch).toHaveBeenCalledTimes(0);
    // Returns exactly the same cached object
    expect(secondResult).toBe(firstResult);
  });
});
