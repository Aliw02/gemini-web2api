import { renderSidebar, initSidebar, renderHistoryList } from '../components/Sidebar.js';
import { renderHeader, bindHeaderEvents, MODELS, updateModelDisplay } from '../components/Header.js';
import { createBubbleRow, renderMd } from '../components/MessageBubble.js';
import { showToast } from '../components/Toast.js';
import { openPanel, closeAllPanels, bindPanelOverlay, renderAllPanels, bindPanelEvents } from '../components/Panels.js';
import { chatCompletion, webSearch } from '../services/api.js';
import * as Storage from '../services/storage.js';
import { state, subscribe, notify, saveConvo, newChat, loadConvo, addMessage, updateMessage, removeLastAssistant, setLoading } from '../store.js';
import { escapeHtml, needsWebSearch, autoResize } from '../utils/helpers.js';

let unsub = null;

export default function chatPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <main id="main">
      ${renderHeader()}
      <div id="chat-area">
        <div class="messages-inner">
          <div class="print-header">
            <h1>ألي AI</h1>
            <p id="print-date"></p>
          </div>
          <div id="welcome" style="${state.messages.length ? 'display:none' : ''}">
            ${renderWelcome()}
          </div>
          <div id="messages-container">${renderExistingMessages()}</div>
          <div id="typing-indicator" class="${state.isLoading ? 'visible' : ''}">
            <div class="msg-avatar ali">ألي</div>
            <div class="typing-bubble">
              <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
            </div>
          </div>
        </div>
      </div>
      <div id="input-area">
        <div class="input-wrapper">
          <div class="input-toolbar">
            <button class="tool-btn ${state.webSearchOn ? 'on' : ''}" id="web-btn">🌐 بحث ويب</button>
            <button class="tool-btn ${state.urlFetchOn ? 'on' : ''}" id="url-btn">🔗 قراءة روابط</button>
            <button class="tool-btn" id="skills-btn">✦ مهارات</button>
            <div class="toolbar-spacer"></div>
            <div class="web-search-badge ${state.webSearchOn ? 'visible' : ''}" id="web-badge">🌐 وضع البحث مفعّل</div>
            <div class="web-search-badge ${state.urlFetchOn ? 'visible' : ''}" id="url-badge">🔗 قراءة الروابط مفعّلة</div>
          </div>
          <div class="input-box">
            <button id="send-btn" ${state.isLoading ? 'disabled' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
            <textarea id="message-input" placeholder="اكتب سؤالك هنا…" rows="1"></textarea>
          </div>
          <div class="input-hint">Enter للإرسال · Shift+Enter لسطر جديد</div>
          <div class="bottom-bar"></div>
        </div>
      </div>
    </main>
      ${renderAllPanels()}
    <div id="skills-panel" class="panel" style="display:none">
      <div class="skills-handle" id="close-skills"></div>
      <div class="skills-body" id="skills-body"></div>
    </div>
  `;

  const d = new Date();
  const el = document.getElementById('print-date');
  if (el) el.textContent = d.toLocaleDateString('ar-SA', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  initSidebar();
  bindHeaderEvents(openPanel);
  bindPanelOverlay();
  bindPanelEvents();
  bindChatEvents();
  renderSkillsPanel();

  state.lastWebSources = [];

  unsub = subscribe(renderFromState);

  const input = document.getElementById('message-input');
  if (input) {
    input.addEventListener('keydown', handleKey);
    input.addEventListener('input', () => autoResize(input));
  }

  return () => {
    if (unsub) unsub();
    state.editingMsgIdx = -1;
  };
}

function renderFromState() {
  const typingEl = document.getElementById('typing-indicator');
  if (typingEl) typingEl.classList.toggle('visible', state.isLoading);

  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) sendBtn.disabled = state.isLoading;

  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = state.messages.length ? 'none' : '';
}

function bindChatEvents() {
  document.getElementById('web-btn')?.addEventListener('click', () => {
    state.webSearchOn = !state.webSearchOn;
    document.getElementById('web-btn').classList.toggle('on', state.webSearchOn);
    document.getElementById('web-badge').classList.toggle('visible', state.webSearchOn);
    Storage.setWebSearch(state.webSearchOn);
    showToast(state.webSearchOn ? '🌐 بحث الويب مفعّل' : 'تم إيقاف بحث الويب');
  });

  document.getElementById('url-btn')?.addEventListener('click', () => {
    state.urlFetchOn = !state.urlFetchOn;
    document.getElementById('url-btn').classList.toggle('on', state.urlFetchOn);
    document.getElementById('url-badge').classList.toggle('visible', state.urlFetchOn);
    Storage.setUrlFetch(state.urlFetchOn);
    showToast(state.urlFetchOn ? '🔗 قراءة الروابط مفعّلة' : 'تم إيقاف قراءة الروابط');
  });

  document.getElementById('skills-btn')?.addEventListener('click', () => openPanel('skills-panel'));

  document.getElementById('suggestions')?.addEventListener('click', (e) => {
    const card = e.target.closest('.suggestion-card');
    if (!card) return;
    const prompt = card.dataset.prompt || card.querySelector('.suggestion-text')?.textContent;
    if (!prompt) return;
    const input = document.getElementById('message-input');
    if (!input) return;
    input.value = prompt;
    autoResize(input);
    sendMessage();
  });

  document.getElementById('send-btn')?.addEventListener('click', sendMessage);

  document.getElementById('message-input')?.addEventListener('keydown', handleKey);

  document.getElementById('messages-container')?.addEventListener('click', (e) => {
    if (e.target.closest('.continue-btn')) {
      continueGeneration();
    }
  });
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function renderWelcome() {
  return `
    <div class="welcome-masthead">
      <div class="masthead-top">The Ali Intelligence — Est. 2026</div>
      <div class="masthead-title">ألي<sup>AI</sup></div>
      <div class="masthead-rule">
        <span style="font-family:'IM Fell English',serif;font-size:14px;color:var(--ink35);font-style:italic">ذكاء اصطناعي بلا حدود</span>
      </div>
      <div class="masthead-sub">"اسأل أي شيء — أجيبك بعلم وأسلوب"</div>
    </div>
    <div class="suggestions" id="suggestions">
      <div class="suggestion-card" data-prompt="اشرح الذكاء الاصطناعي ببساطة">
        <span class="suggestion-icon">🧠</span>
        <div class="suggestion-text">اشرح الذكاء الاصطناعي ببساطة</div>
      </div>
      <div class="suggestion-card" data-prompt="رسالة تسويقية احترافية">
        <span class="suggestion-icon">✒️</span>
        <div class="suggestion-text">رسالة تسويقية احترافية</div>
      </div>
      <div class="suggestion-card" data-prompt="أفضل ممارسات Python">
        <span class="suggestion-icon">📜</span>
        <div class="suggestion-text">أفضل ممارسات Python</div>
      </div>
    </div>
  `;
}

function renderExistingMessages() {
  let html = '';
  for (let i = 0; i < state.messages.length; i++) {
    const m = state.messages[i];
    if (m.role === 'error') {
      html += `<div class="error-bubble">${escapeHtml(m.content)}</div>`;
      continue;
    }
    const isUser = m.role === 'user';
    const tags = [
      m.webSearch ? '<span class="msg-web-tag">🌐 بحث الويب</span>' : '',
      m.hasUrl ? '<span class="msg-url-tag">🔗 تم قراءة الرابط</span>' : '',
    ].filter(Boolean).join('');

    const body = isUser ? escapeHtml(m.display || m.content).replace(/\n/g, '<br>') : renderMd(m.content);

    html += `
      <div class="message-row ${isUser ? 'user' : 'ai'}">
        <div class="msg-avatar ${isUser ? 'user-av' : 'ali'}">${isUser ? 'أنت' : 'ألي'}</div>
        <div class="msg-content">
          <div class="msg-sender">${isUser ? 'أنت' : 'ألي AI'}</div>
          ${tags ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${tags}</div>` : ''}
          <div class="msg-bubble ${isUser ? 'editable' : ''}" data-msg-idx="${i}">${body}</div>
          ${!isUser ? `<div class="msg-actions"><button class="msg-action-btn" onclick="window.copyMsg('msg-${i}')">✦ نسخ</button><button class="msg-action-btn" onclick="window.regenerateLast()">↻ إعادة</button></div>` : ''}
          ${isUser && i === state.messages.length - 1 ? `<div class="msg-actions"><button class="msg-action-btn" onclick="editMessage(${i})">✏️ تعديل</button></div>` : ''}
          ${i === state.messages.length - 1 && !isUser ? '<button class="continue-btn" id="continue-btn">✚ أكمل الإجابة</button>' : ''}
        </div>
      </div>
    `;
  }
  return html;
}

function renderSkillsPanel() {
  const body = document.getElementById('skills-body');
  if (!body) return;

  const skillsHTML = SKILLS_DATA.map(group => `
    <div class="skills-section-title">${group.title}</div>
    <div class="skills-grid">
      ${group.skills.map(s => `
        <div class="skill-card" data-template="${escapeHtml(s.template)}">
          <span class="skill-icon">${s.icon}</span>
          <div class="skill-name">${s.name}</div>
          <div class="skill-desc">${s.desc}</div>
        </div>
      `).join('')}
    </div>
  `).join('');

  body.innerHTML = skillsHTML;

  body.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('click', () => {
      const template = card.dataset.template;
      if (!template) return;
      closeAllPanels();
      const input = document.getElementById('message-input');
      if (!input) return;
      input.value = template;
      autoResize(input);
      input.focus();
    });
  });
}

// ─── Message Sending ─────────────────────────────────────

async function sendMessage() {
  const input = document.getElementById('message-input');
  const text = input?.value?.trim();
  if (!text || state.isLoading) return;

  const welcome = document.getElementById('welcome');
  if (welcome) welcome.style.display = 'none';
  if (!state.currentConvoId) state.currentConvoId = 'c_' + Date.now();

  const isWeb = state.webSearchOn;
  input.value = '';
  input.style.height = 'auto';
  setLoading(true);

  const urlMatch = text.match(/https?:\/\/[^\s]+/g);

  let urlContext = '';
  if (state.urlFetchOn && urlMatch) {
    showToast('⏳ جاري قراءة الرابط…');
    for (const url of urlMatch) {
      const fetched = await fetchUrlContext(url);
      if (fetched) urlContext += fetched + '\n\n';
    }
  }

  let webContext = '';
  let webSources = [];
  if (isWeb && !urlMatch && needsWebSearch(text)) {
    showToast('🌐 جاري البحث في الويب…');
    try {
      const result = await webSearch(text);
      webContext = result.text;
      webSources = result.sources;
    } catch {
      webContext = 'تعذّر إجراء البحث حالياً.';
    }
  }

  let userContent = text;
  if (urlContext) {
    userContent += `\n\n[محتوى الروابط المرفقة — هذا محتوى حقيقي جلبته أداة القراءة]\n${urlContext}[انتهى محتوى الروابط]`;
  }
  if (webContext) {
    userContent += `\n\n[نتائج البحث الحية من الإنترنت — هذه نتائج حقيقية ومحدّثة، استخدمها للإجابة]\n${webContext}\n[انتهت نتائج البحث — أجب بناءً عليها مباشرةً ولا تقل أنك لا تستطيع الوصول للإنترنت]`;
  }

  const hasUrl = urlMatch && urlContext.length > 0;
  state.lastWebSources = webSources;

  addMessage({ role: 'user', content: userContent, display: text, webSearch: isWeb, hasUrl });
  appendUserBubble(text, isWeb, hasUrl);
  scrollBottom();

  try {
    const aiText = await streamCompletion(webSources);
    addMessage({ role: 'assistant', content: aiText });
    saveConvo();
    renderExistingMessages();
  } catch (err) {
    showToast('⚠️ خطأ: ' + err.message);
    appendError(err.message);
  }

  setLoading(false);
  scrollBottom();
}

function appendUserBubble(content, isWeb, hasUrl) {
  const container = document.getElementById('messages-container');
  const row = createBubbleRow('user', content, null, isWeb, hasUrl);
  container.appendChild(row);
}

function appendError(msg) {
  const container = document.getElementById('messages-container');
  const e = document.createElement('div');
  e.className = 'error-bubble';
  e.textContent = 'حدث خطأ في الاتصال: ' + msg;
  container.appendChild(e);
}

async function streamCompletion(webSources) {
  const sysPrompt = state.systemPrompt;
  let systemMsg = {
    role: 'user',
    content: `أنت ألي AI — مساعد ذكي باللغتين العربية والإنجليزية. قواعد ثابتة:
١. لديك أداة بحث ويب حقيقية وأداة قراءة روابط تعملان الآن.
٢. أي نص بين [نتائج البحث الحية من الإنترنت] هو بيانات حقيقية محدّثة — استخدمها مباشرة للإجابة.
٣. أي نص بين [محتوى الروابط المرفقة] هو محتوى فعلي جلبته أداة القراءة — ناقشه بتفصيل.
٤. لا تقل أبداً "لا أستطيع الوصول للإنترنت" أو "ليس لدي أدوات بحث" — هذا خطأ.
٥. أجب دائماً بنفس لغة المستخدم (عربي أو إنجليزي).${sysPrompt ? '\n\nتعليمات إضافية من المستخدم:\n' + sysPrompt : ''}`
  };
  const systemReply = { role: 'assistant', content: 'مفهوم تماماً. سأستخدم نتائج البحث وبيانات الروابط الموجودة في الرسائل للإجابة بدقة، ولن أدّعي عدم قدرتي للوصول للإنترنت.' };

  const apiMessages = [systemMsg, systemReply, ...state.messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }))];

  const bubbleId = 'b_' + Date.now();
  const container = document.getElementById('messages-container');
  container.appendChild(createBubbleRow('ai', '', bubbleId));
  scrollBottom();

  const thinkParam = state.currentThinkLevel !== undefined && state.currentThinkLevel !== null
    ? `@think=${state.currentThinkLevel}`
    : '';

  try {
    const full = await chatCompletion(apiMessages, state.currentModel + thinkParam, (text) => {
      const el = document.getElementById(bubbleId);
      if (el) {
        el.innerHTML = renderMd(text);
        scrollBottom();
      }
    });

    if (webSources && webSources.length) {
      const bubbleRow = document.getElementById(bubbleId)?.closest('.message-row');
      if (bubbleRow) {
        const sourcesEl = document.createElement('div');
        sourcesEl.className = 'search-sources';
        sourcesEl.innerHTML = `<div class="search-sources-label">📌 المصادر</div>` +
          webSources.map(s => `<a class="source-chip" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title || s.source || s.url)}</a>`).join('');
        bubbleRow.querySelector('.msg-content').appendChild(sourcesEl);
      }
    }

    return full;
  } catch (err) {
    const el = document.getElementById(bubbleId);
    if (el) el.innerHTML = `<div class="error-bubble">⚠️ ${escapeHtml(err.message)}</div>`;
    throw err;
  }
}

async function continueGeneration() {
  if (state.isLoading || !state.messages.length) return;
  const lastMsg = state.messages[state.messages.length - 1];
  if (lastMsg.role !== 'assistant') return;

  const continuePrompt = '\n\n[أكمل إجابتك من حيث توقفت — استمر دون تكرار أو مقدمة]';
  addMessage({ role: 'user', content: continuePrompt, display: null });

  setLoading(true);
  try {
    const aiText = await streamCompletion([]);
    addMessage({ role: 'assistant', content: aiText });
    saveConvo();
    renderExistingMessages();
  } catch (err) {
    showToast('⚠️ خطأ: ' + err.message);
  }
  setLoading(false);
  scrollBottom();
}

// ─── Edit Message ────────────────────────────────────────

window.editMessage = function(idx) {
  state.editingMsgIdx = idx;
  const msg = state.messages[idx];
  if (!msg || msg.role !== 'user') return;

  const bubbles = document.querySelectorAll('.msg-bubble[data-msg-idx]');
  for (const b of bubbles) {
    if (parseInt(b.dataset.msgIdx) === idx) {
      const text = msg.display || msg.content;
      b.innerHTML = `
        <textarea class="msg-edit-area">${escapeHtml(text)}</textarea>
        <div class="msg-edit-actions">
          <button class="msg-edit-save" onclick="saveEdit(${idx})">💾 حفظ</button>
          <button class="msg-edit-cancel" onclick="cancelEdit(${idx})">✕ إلغاء</button>
        </div>
      `;
    }
  }
};

window.saveEdit = function(idx) {
  const textarea = document.querySelector(`.msg-bubble[data-msg-idx="${idx}"] .msg-edit-area`);
  if (!textarea || !textarea.value.trim()) return;
  const newText = textarea.value.trim();
  const msg = state.messages[idx];
  if (!msg) return;

  msg.display = newText;
  msg.content = newText;

  state.messages = state.messages.slice(0, idx + 1);
  state.editingMsgIdx = -1;
  renderExistingMessages();
  setLoading(false);

  const input = document.getElementById('message-input');
  if (input) input.value = newText;
};

window.cancelEdit = function(idx) {
  state.editingMsgIdx = -1;
  renderExistingMessages();
};

window.regenerateLast = function() {
  if (state.isLoading) return;
  setLoading(true);
  const idx = removeLastAssistant();
  if (idx === -1) { setLoading(false); return; }
  renderExistingMessages();
  streamCompletion(state.lastWebSources).then(aiText => {
    addMessage({ role: 'assistant', content: aiText });
    saveConvo();
    renderExistingMessages();
  }).catch(err => {
    showToast('⚠️ خطأ: ' + err.message);
  }).finally(() => {
    setLoading(false);
    scrollBottom();
  });
};

window.copyMsg = function(id) {
  const el = document.getElementById(id);
  if (el) navigator.clipboard.writeText(el.innerText);
};

// ─── URL Fetcher ─────────────────────────────────────────

async function fetchUrlContext(url) {
  const cached = getCachedUrl(url);
  if (cached) return cached;

  try {
    const ghRepo = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)\/?$/);
    if (ghRepo) {
      const [, owner, repo] = ghRepo;
      const content = await fetchGitHubRepo(owner, repo);
      if (content) setCachedUrl(url, content);
      return content;
    }

    const ghBlob = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)\/(?:blob|tree)\/([^/]+)\/(.+)$/);
    if (ghBlob) {
      const [, owner, repo, ref, path] = ghBlob;
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
      const res = await fetch(rawUrl, { cache: 'no-store' });
      if (res.ok) {
        const t = await res.text();
        const content = `[محتوى: ${url}]\n${t.slice(0, 6000)}`;
        setCachedUrl(url, content);
        return content;
      }
    }

    const ghMeta = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)\/?/);
    if (ghMeta) {
      const [, owner, repo] = ghMeta;
      const content = await fetchGitHubRepo(owner, repo);
      if (content) setCachedUrl(url, content);
      return content;
    }

    const resp = await fetch(url, { cache: 'no-store' });
    if (resp.ok) {
      const html = await resp.text();
      const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
      if (text.length > 50) {
        const content = `[محتوى: ${url}]\n${text}`;
        setCachedUrl(url, content);
        return content;
      }
    }
  } catch {}

  return null;
}

async function fetchGitHubRepo(owner, repo) {
  const cacheKey = `gh:${owner}/${repo}`;
  const cached = getCachedUrl(cacheKey);
  if (cached) return `[GitHub: ${owner}/${repo}]\n${cached}`;

  const headers = { Accept: 'application/vnd.github+json' };
  let result = '';

  try {
    const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers, cache: 'no-store' });
    if (!meta.ok) {
      const { text: searchResults } = await webSearch(`${owner} ${repo} github`);
      return `[مستودع GitHub: ${owner}/${repo}]\nتعذّر الوصول عبر GitHub API.\n\n${searchResults}`;
    }
    const m = await meta.json();
    result += `الاسم: ${m.full_name}\nالوصف: ${m.description || 'لا يوجد وصف'}\nاللغة: ${m.language || 'غير محدد'} | النجوم: ${m.stargazers_count} | Forks: ${m.forks_count}\nآخر تحديث: ${m.updated_at?.slice(0, 10)}\n\n`;
  } catch {}

  try {
    const tree = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, { headers, cache: 'no-store' });
    if (tree.ok) {
      const files = await tree.json();
      if (Array.isArray(files)) {
        result += `الملفات والمجلدات:\n`;
        files.slice(0, 30).forEach(f => { result += `  ${f.type === 'dir' ? '📁' : '📄'} ${f.name}\n`; });
        result += '\n';
      }
    }
  } catch {}

  for (const branch of ['main', 'master']) {
    try {
      const r = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`, { cache: 'no-store' });
      if (r.ok) {
        result += `README.md:\n${(await r.text()).slice(0, 5000)}\n`;
        break;
      }
    } catch {}
  }

  setCachedUrl(cacheKey, result);
  return `[GitHub: ${owner}/${repo}]\n${result}`;
}

function getCachedUrl(key) {
  const entry = state.urlCache.get(key);
  if (entry && Date.now() - entry.ts < 86400000) return entry.content;
  if (entry) state.urlCache.delete(key);
  return null;
}

function setCachedUrl(key, content) {
  state.urlCache.set(key, { ts: Date.now(), content });
}

function scrollBottom() {
  const ca = document.getElementById('chat-area');
  if (ca) ca.scrollTo({ top: ca.scrollHeight, behavior: 'smooth' });
}

const SKILLS_DATA = [
  {
    title: '🔧 PRODUCTION ENGINEERING',
    skills: [
      { icon: '🚨', name: 'Outage Debugging', desc: 'PagerDuty 503s — find root cause in 30 min', template: '🏆 Your Role: Senior SRE on-call for an e-commerce platform doing $1M/day.\n🎯 Your Goal: Debug and resolve a production outage — checkout API returning 503 errors at 2 AM.\n📋 Context: Last deploy rolled out 2 hours ago. PagerDuty alert triggered. Grafana shows error rate spiking from 0.1% to 45%.' },
      { icon: '📈', name: 'Latency Crisis', desc: 'p99 120ms → 8s — find the bottleneck', template: '🏆 Your Role: Backend platform engineer for a B2B SaaS company with 10K API requests/sec.\n🎯 Your Goal: Investigate and fix a sudden p99 latency spike from 120ms to 8 seconds.' },
      { icon: '💾', name: 'Data Recovery', desc: 'Accidental DELETE on prod — PITR rescue', template: '🏆 Your Role: Senior DRE for fintech doing $5M/day.\n🎯 Your Goal: Recover accidentally deleted customer transaction records from production PostgreSQL.\n📋 Context: A developer ran DELETE without WHERE on transactions table (5M rows).' },
      { icon: '⚡', name: 'Capacity Crisis', desc: '20x traffic spike — keep the site alive', template: '🏆 Your Role: Infrastructure engineer at a social media startup doing 10K req/s normally.\n🎯 Your Goal: Keep the platform online after a celebrity tweet sends traffic 20x above normal.' },
    ],
  },
  {
    title: '🏗️ SYSTEM ARCHITECTURE',
    skills: [
      { icon: '🔗', name: 'URL Shortener', desc: '100M URLs, 1B redirects/day', template: '🏆 Your Role: Staff engineer. Design a scalable URL shortener handling 100M URLs and 1B redirects/day with click analytics.' },
      { icon: '💬', name: 'Real-time Chat', desc: '10M users, 1M WebSockets', template: '🏆 Your Role: Principal engineer. Architect a real-time chat system with group chats, file sharing, typing indicators, and offline delivery.' },
      { icon: '🏛️', name: 'Data Warehouse', desc: '50 sources, Medallion + dbt', template: '🏆 Your Role: Analytics engineer building the central data platform for 100+ analysts.' },
    ],
  },
  {
    title: '🛠️ RESEARCH & TOOLS',
    skills: [
      { icon: '🔍', name: 'Deep Research', desc: 'Tech due diligence + benchmarks', template: '🏆 Your Role: Technical advisor evaluating a technology for the next 5 years.\n🎯 Your Goal: Perform deep due diligence on a technology and produce a recommendation with benchmarks and risk analysis.' },
      { icon: '🐛', name: 'Debug Session', desc: 'Heisenbug — race condition', template: '🏆 Your Role: Senior engineer debugging a mysterious heisenbug that has been open for 3 months across 3 teams.' },
      { icon: '🚀', name: 'Performance Audit', desc: 'Lighthouse 95+, p99 < 200ms', template: '🏆 Your Role: Performance architect auditing a slow e-commerce application.' },
    ],
  },
  {
    title: '📝 PRODUCTIVITY',
    skills: [
      { icon: '✍️', name: 'كتابة احترافية', desc: 'مقالات، رسائل، بريد إلكتروني', template: 'ساعدني في كتابة نص احترافي بالتنسيق المناسب للموضوع التالي:' },
      { icon: '🌐', name: 'ترجمة', desc: 'ترجمة دقيقة بين AR/EN', template: 'ترجم النص التالي بدقة مع الحفاظ على الأسلوب والسياق:' },
      { icon: '💻', name: 'كود Python', desc: 'كتابة وتصحيح أكواد Python', template: 'ساعدني في كتابة كود Python لحل المشكلة التالية:' },
    ],
  },
];
