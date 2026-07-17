// Lightweight API utilities: timeout, retry, safe parse
//
// Security note: this client calls the Gemini API directly from the browser
// using a VITE_-prefixed key, which means the key is bundled into the
// shipped JS and is visible to anyone who opens devtools. Vite only exposes
// env vars prefixed with VITE_ to client code on purpose (see
// https://vitejs.dev/guide/env-and-mode.html#env-files) - it does NOT make
// the key safe to expose. For a real deployment this call should go through
// a small backend/serverless proxy that holds the key server-side and
// forwards requests; this file is written so that swapping the fetch target
// for a proxy endpoint is a one-line change.
const MAX_PROMPT_LENGTH = 6000; // guards against oversized/abusive payloads

export async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function callGeminiSafe(promptText, mode = 'json', maxAttempts = 2) {
  if (typeof promptText !== 'string' || !promptText.trim()) {
    throw new Error('Prompt text must be a non-empty string.');
  }

  // Vite only ever exposes import.meta.env.VITE_* to the client bundle;
  // process.env is not defined in the browser, so the old fallback to it
  // was dead code that silently never ran.
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  // Cap prompt size before it goes anywhere near the network call.
  const safePrompt = promptText.length > MAX_PROMPT_LENGTH
    ? promptText.slice(0, MAX_PROMPT_LENGTH)
    : promptText;

  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = { contents: [{ parts: [{ text: safePrompt }] }] };
  if (mode === 'json') requestBody.generationConfig = { responseMimeType: 'application/json' };

  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetchWithTimeout(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, 8000);

      if (!res.ok) {
        // Don't surface the raw response body (it can echo request data);
        // keep the error informative but minimal.
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const data = await res.json().catch(() => null);
      if (!data) throw new Error('Empty JSON payload');

      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) throw new Error('Invalid or empty response payload.');
      return contentText;
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}
