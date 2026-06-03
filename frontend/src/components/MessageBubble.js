import { escapeHtml } from '../utils/helpers.js';

export function renderMd(text) {
  if (!text) return '';
  try {
    let html = escapeHtml(text);
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const badge = lang ? `<span class="code-lang">${lang}</span>` : '<span></span>';
      const escaped = escapeHtml(code);
      return `<div class="code-block-wrap"><div class="code-header">${badge}<button class="code-copy-btn" onclick="(function(b){navigator.clipboard.writeText(b.closest('.code-block-wrap').querySelector('code').innerText).then(()=>{b.textContent='\u2713 \u062A\u0645';setTimeout(()=>{b.textContent='\uD83D\uDCCB \u0646\u0633\u062E'},1500)})})(this)">📋 نسخ</button></div><pre><code class="language-${lang}">${escaped}</code></pre></div>`;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/\n/g, '<br>');
    return html;
  } catch {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }
}

export function createBubbleRow(role, content, bubbleId, isWeb, hasUrl) {
  const isUser = role === 'user';
  const row = document.createElement('div');
  row.className = `message-row ${isUser ? 'user' : 'ai'}`;
  const id = bubbleId || ('b_' + Date.now() + Math.random().toString(36).slice(2));

  const body = isUser ? escapeHtml(content).replace(/\n/g, '<br>') : renderMd(content);

  const tags = [
    isWeb ? '<span class="msg-web-tag">🌐 بحث الويب</span>' : '',
    hasUrl ? '<span class="msg-url-tag">🔗 تم قراءة الرابط</span>' : '',
  ].filter(Boolean).join('');

  row.innerHTML = `
    <div class="msg-avatar ${isUser ? 'user-av' : 'ali'}">${isUser ? 'أنت' : 'ألي'}</div>
    <div class="msg-content">
      <div class="msg-sender">${isUser ? 'أنت' : 'ألي AI'}</div>
      ${tags ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${tags}</div>` : ''}
      <div class="msg-bubble ${isUser ? 'editable' : ''}" id="${id}" ${isUser ? `data-msg-idx="${id}"` : ''}>${body}</div>
      ${!isUser ? `<div class="msg-actions"><button class="msg-action-btn" onclick="copyMsg('${id}')">✦ نسخ</button><button class="msg-action-btn" onclick="regenerateLast('${id}')">↻ إعادة</button></div>` : ''}
      ${isUser && hasUrl ? `<div class="msg-actions"><button class="msg-action-btn" onclick="bustAndRefetchUrl('${id}')">🔄 تحديث الرابط</button></div>` : ''}
    </div>
  `;

  return row;
}
