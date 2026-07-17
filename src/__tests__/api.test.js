import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callGeminiSafe } from '../utils/api';

describe('callGeminiSafe', () => {
  const originalFetch = global.fetch;
  const originalKey = import.meta.env.VITE_GEMINI_API_KEY;

  beforeEach(() => {
    import.meta.env.VITE_GEMINI_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    import.meta.env.VITE_GEMINI_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it('rejects empty prompts before making a network call', async () => {
    global.fetch = vi.fn();
    await expect(callGeminiSafe('   ')).rejects.toThrow(/non-empty string/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws a clear error when no API key is configured', async () => {
    import.meta.env.VITE_GEMINI_API_KEY = '';
    global.fetch = vi.fn();
    await expect(callGeminiSafe('hello')).rejects.toThrow(/not configured/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns the model text on a successful call', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'hi there' }] } }] }),
    });
    const result = await callGeminiSafe('hello', 'text', 1);
    expect(result).toBe('hi there');
  });

  it('does not leak response body text into the thrown error on HTTP failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      text: async () => 'secret internal trace',
    });
    await expect(callGeminiSafe('hello', 'text', 1)).rejects.toThrow('HTTP 500 Server Error');
  });
});
