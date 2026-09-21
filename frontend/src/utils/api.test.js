import { test, mock, before } from 'node:test';
import assert from 'node:assert';

// Mock window before importing api.js
global.window = {
  location: {
    port: '8080',
    origin: 'http://localhost:8080'
  }
};

let api;

before(async () => {
  const module = await import('./api.js');
  api = module.api;
});

test('api.js request timeout', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });

  global.fetch = mock.fn(async (url, options) => {
    return new Promise((resolve, reject) => {
      // Abort controller implementation handling
      if (options && options.signal) {
        options.signal.addEventListener('abort', () => {
          const e = new Error('AbortError');
          e.name = 'AbortError';
          reject(e);
        });
      }
    });
  });

  const reqPromise = api.get('/test');

  // Wait for the fetch call to be initialized
  await new Promise(resolve => setImmediate(resolve));

  // Fast-forward time
  mock.timers.tick(10000);

  try {
    await reqPromise;
    assert.fail('Should have thrown timeout error');
  } catch (e) {
    assert.strictEqual(e.message, 'Request timed out — is the backend running?');
  }

  mock.reset();
});

test('api.js request success', async () => {
  global.fetch = mock.fn(async () => {
    return {
      ok: true,
      json: async () => ({ success: true })
    };
  });

  const res = await api.get('/test');
  assert.strictEqual(res.success, true);

  mock.reset();
});

test('api.js request error parsing', async () => {
  global.fetch = mock.fn(async () => {
    return {
      ok: false,
      json: async () => ({ detail: 'Custom error message' })
    };
  });

  try {
    await api.get('/test');
    assert.fail('Should have thrown error');
  } catch (e) {
    assert.strictEqual(e.message, 'Custom error message');
  }

  mock.reset();
});

test('api.js request generic error', async () => {
  global.fetch = mock.fn(async () => {
    return {
      ok: false,
      json: async () => { throw new Error('Parse error'); }
    };
  });

  try {
    await api.get('/test');
    assert.fail('Should have thrown error');
  } catch (e) {
    assert.strictEqual(e.message, 'Request failed');
  }

  mock.reset();
});

test('api.js request network error', async () => {
  global.fetch = mock.fn(async () => {
    throw new Error('Network error');
  });

  try {
    await api.get('/test');
    assert.fail('Should have thrown error');
  } catch (e) {
    assert.strictEqual(e.message, 'Network error');
  }

  mock.reset();
});

test('api.js clears timeout on success', async () => {
  let timeoutCleared = false;
  const originalClearTimeout = global.clearTimeout;

  global.clearTimeout = (id) => {
    timeoutCleared = true;
    originalClearTimeout(id);
  };

  global.fetch = mock.fn(async () => {
    return {
      ok: true,
      json: async () => ({ success: true })
    };
  });

  await api.get('/test');
  assert.strictEqual(timeoutCleared, true);

  global.clearTimeout = originalClearTimeout;
  mock.reset();
});
