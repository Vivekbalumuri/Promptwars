// Lightweight API utilities: timeout, retry, safe parse
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
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = { contents: [{ parts: [{ text: promptText }] }] };
  if (mode === 'json') requestBody.generationConfig = { responseMimeType: 'application/json' };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetchWithTimeout(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, 8000);

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const msg = `HTTP ${res.status} ${res.statusText} - ${text}`;
        throw new Error(msg);
      }

      const data = await res.json().catch(() => null);
      if (!data) throw new Error('Empty JSON payload');

      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!contentText) throw new Error('Invalid or empty response payload.');
      return contentText;
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}
