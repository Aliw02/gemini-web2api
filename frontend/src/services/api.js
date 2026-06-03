const STORAGE_KEY = 'ali_server_config';

function getConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { baseUrl: '', apiKey: '' };
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function baseUrl() {
  return getConfig().baseUrl || '';
}

function apiKey() {
  return getConfig().apiKey || '';
}

async function chatCompletion(messages, model, onDelta) {
  const url = baseUrl() + '/v1/chat/completions';
  const headers = { 'Content-Type': 'application/json' };
  const key = apiKey();
  if (key) headers['Authorization'] = 'Bearer ' + key;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(errText || `HTTP ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = '', buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return full;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content || '';
        if (delta) {
          full += delta;
          onDelta(full);
        }
      } catch {}
    }
  }
  return full;
}

async function webSearch(query) {
  const url = baseUrl() + '/v1/search?q=' + encodeURIComponent(query);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  const items = data.results || [];
  if (!items.length) return { text: 'لم يتم العثور على نتائج بحث.', sources: [] };

  const text = items.map(r => {
    const src = r.source ? `[${r.source}]` : '';
    const url = r.url ? `\nالرابط: ${r.url}` : '';
    return `${src} ${r.title}\n${r.snippet}${url}`;
  }).join('\n\n');

  const sources = items.filter(r => r.url).map(r => ({
    title: r.title, url: r.url, source: r.source || '',
  }));
  return { text, sources };
}

export { getConfig, saveConfig, chatCompletion, webSearch };
