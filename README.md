# gemini-web2api + Ali Chat UI

<p align="center">
  <img src="logo.png" width="160" alt="logo">
</p>

<p align="center">
  <strong>Free Gemini AI — no API key, no account, no cost</strong><br>
  OpenAI-compatible server · built-in web search · beautiful Arabic/English chat UI
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8+-blue?style=flat-square&logo=python">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square">
  <img src="https://img.shields.io/badge/Gemini-Free-gold?style=flat-square&logo=google">
  <img src="https://img.shields.io/badge/Arabic-RTL_Support-teal?style=flat-square">
</p>

---

## What is this?

**gemini-web2api** reverse-proxies Google Gemini's web interface into a local OpenAI-compatible API — no official API key needed. On top of that, this fork ships **Ali Chat UI** (`ali-chat.html`): a full-featured, single-file chat frontend with real-time web search, URL reading, model switching, and a polished bilingual (Arabic + English) design.

---

## Ali Chat UI — Feature Overview

Open `ali-chat.html` in any browser (while the server is running) for an instant chat experience:

| Feature | Details |
|---------|---------|
| **Real-time web search** | DuckDuckGo results injected into every relevant query; source chips shown below the answer |
| **URL reading** | Paste any link — the AI reads and discusses its content |
| **GitHub repo analysis** | Paste a GitHub URL to get stars, description, language, and recent commits |
| **Model selector** | Switch between Flash, Flash Thinking, Flash Lite, Pro, Auto — persisted in localStorage |
| **Code copy buttons** | Every code block gets a one-click copy button |
| **Regenerate response** | Re-run the last AI answer with one click |
| **Skills panel** | 20+ prompt templates: writing, translation, coding (Python/JS/SQL/Regex), analysis, marketing, web search |
| **4 themes** | Paper · Night · Sepia · Slate — saved per session |
| **Export** | PDF · TXT · Markdown · Copy All |
| **Conversation history** | Multiple chats stored in localStorage |
| **Bilingual** | Full Arabic RTL + English support |
| **Streaming** | Token-by-token streaming with typing indicator |

### Screenshots

> Open `ali-chat.html` while the server runs on port 8081.

---

## Quick Start

### 1 — Install & run the server

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/gemini-web2api
cd gemini-web2api

# Install (optional: enables real web search in Ali Chat)
pip install ddgs

# Start
python gemini_web2api.py
```

Server starts at `http://localhost:8081/v1`.

### 2 — Open the chat UI

Double-click `ali-chat.html` **or** open it in your browser:

```
file:///path/to/gemini-web2api/ali-chat.html
```

That's it — start chatting for free.

---

## Web Search (Ali Chat)

The chat UI automatically searches DuckDuckGo for questions that need up-to-date information, then injects the results into the AI's context so it answers with real, current data.

**Enable/disable**: click the `🌐 بحث ويب` toggle in the input toolbar.  
**Sources**: after each web-searched response, clickable source chips appear below the answer.

Install the search dependency:
```bash
pip install ddgs
```

---

## Available Models

| Model ID | Label | Notes |
|----------|-------|-------|
| `gemini-3.5-flash` | Flash 3.5 | Fast · **Default** |
| `gemini-3.5-flash-thinking` | Flash 3.5 Thinking | Deep reasoning · long output |
| `gemini-3.5-flash-thinking-lite` | Flash 3.5 Lite | Adaptive thinking |
| `gemini-3.1-pro` | Pro 3.1 | Needs cookie for real Pro routing |
| `gemini-auto` | Auto | Gemini chooses the best model |
| `gemini-flash-lite` | Flash Lite | Lightest, fastest |

### Thinking Depth

Append `@think=N` to any thinking model:
```
gemini-3.5-flash-thinking@think=0   # deepest (default)
gemini-3.5-flash-thinking@think=2   # medium
gemini-3.5-flash-thinking@think=4   # shallowest / fastest
```

---

## Use with Any OpenAI Client

Point any OpenAI-compatible app at `http://localhost:8081/v1`:

### curl
```bash
curl http://localhost:8081/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"gemini-3.5-flash","messages":[{"role":"user","content":"Hello!"}]}'
```

### Python (openai SDK)
```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:8081/v1", api_key="anything")
resp = client.chat.completions.create(
    model="gemini-3.5-flash-thinking",
    messages=[{"role": "user", "content": "Explain quantum computing"}]
)
print(resp.choices[0].message.content)
```

### Cherry Studio / ChatBox / SillyTavern

| Field | Value |
|-------|-------|
| Base URL | `http://localhost:8081/v1` |
| API Key | anything (or a key from `api_keys` in config) |
| Model | `gemini-3.5-flash` |

### Gemini CLI
```bash
export GEMINI_API_KEY=none
export GOOGLE_GEMINI_BASE_URL=http://localhost:8081
gemini
```

---

## Configuration (`config.json`)

```json
{
  "port": 8081,
  "host": "127.0.0.1",
  "retry_attempts": 3,
  "retry_delay_sec": 2,
  "request_timeout_sec": 180,
  "default_model": "gemini-3.5-flash",
  "api_keys": [],
  "cookie_file": null,
  "proxy": null,
  "log_requests": true
}
```

`api_keys: []` → no authentication required. Add keys to enforce Bearer auth.

---

## Optional: Cookie (for real Pro routing)

Without a cookie, `gemini-3.1-pro` routes to Flash internally. For real Pro access:

1. Open Chrome → go to [gemini.google.com](https://gemini.google.com) → sign in (free account)
2. DevTools (F12) → Application → Cookies → `https://gemini.google.com`
3. Copy: `SID`, `HSID`, `SSID`, `APISID`, `SAPISID`, `__Secure-1PSID`
4. Save to `cookie.txt`:
```
SID=xxx; HSID=xxx; SSID=xxx; APISID=xxx; SAPISID=xxx; __Secure-1PSID=xxx
```
5. Run:
```bash
python gemini_web2api.py --cookie-file cookie.txt
```

---

## Proxy

If `gemini.google.com` is blocked in your region:

```bash
python gemini_web2api.py --proxy http://127.0.0.1:7890
```

Or in `config.json`:
```json
{"proxy": "http://127.0.0.1:7890"}
```

---

## Docker

```bash
cp config.example.json config.json
docker compose up -d
```

Or manually:
```bash
docker build -t gemini-web2api .
docker run -d -p 8081:8081 -v ./config.json:/app/config.json gemini-web2api
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/chat/completions` | OpenAI-compatible chat (streaming + non-streaming) |
| `GET /v1/models` | List available models |
| `GET /v1/search?q=...` | DuckDuckGo web search (used by Ali Chat UI) |
| `POST /v1/responses` | Responses API (Codex CLI compatible) |
| `GET /v1beta/models` | Google native API (Gemini CLI compatible) |

---

## How It Works

The server reverse-engineers Google Gemini's `StreamGenerate` web protocol — the same endpoint the browser uses. It translates between OpenAI's JSON API format and Gemini's internal protobuf-like format. Model selection maps to the `MODE_CATEGORY` enum in Gemini's frontend JavaScript.

The Ali Chat UI calls `/v1/chat/completions` for streaming AI responses and `/v1/search` for DuckDuckGo results, all from a single HTML file with zero external dependencies beyond `marked.js` for Markdown rendering.

---

## Limitations

- **No image/vision input**: Gemini's image upload uses a proprietary streaming RPC (WIZ/ProcessFile) that cannot be replicated.
- **Pro without cookie = Flash**: Without authentication, Pro requests route to the same Flash backend.
- **Rate limits**: Heavy use may be throttled by Google. The server retries automatically.
- **Single-user local use**: Designed for personal local use, not a multi-user production server.

---

## Requirements

- Python 3.8+
- No mandatory dependencies (stdlib only for the server)
- `pip install ddgs` — optional, enables web search in Ali Chat UI
- Network access to `gemini.google.com`

---

## License

MIT — fork it, use it, improve it.

---

## Credits

- Original server: [Sophomoresty/gemini-web2api](https://github.com/Sophomoresty/gemini-web2api)
- Ali Chat UI: added in this fork
- Agent framework: [GenericAgent](https://github.com/lsdefine/GenericAgent)
