import { escapeHtml } from '../utils/helpers.js';
import { state, newChat, loadConvo, deleteConvo } from '../store.js';
import { navigate } from '../router.js';

export function renderSidebar() {
  return `
    <aside id="sidebar" class="${state.sidebarOpen ? '' : 'collapsed'}">
      <div class="sidebar-header">
        <div class="brand-stamp">
          <div class="stamp-circle">ألي</div>
          <div>
            <div class="brand-name">ألي AI</div>
            <div class="brand-tagline">ذكاء اصطناعي بلا حدود</div>
          </div>
        </div>
      </div>
      <button class="new-chat-btn" id="new-chat-btn">＋ محادثة جديدة</button>

      <div style="padding:4px 12px;position:relative;z-index:1">
        <button class="tool-btn" style="width:100%;justify-content:center" id="nav-history">📋 السجل</button>
      </div>

      <div class="section-label">المحادثات</div>
      <div class="history-list" id="history-list">${renderHistoryItems()}</div>

      <div class="sidebar-footer">
        <span id="sidebar-model">مدعوم بـ Flash · مجاناً بالكامل</span>
        <br>
        <button class="tool-btn" style="margin-top:6px;width:100%;justify-content:center" id="nav-settings">⚙️ الإعدادات</button>
      </div>
    </aside>
  `;
}

export function initSidebar() {
  document.getElementById('new-chat-btn')?.addEventListener('click', () => { newChat(); navigate('/'); });
  document.getElementById('nav-history')?.addEventListener('click', () => navigate('/history'));
  document.getElementById('nav-settings')?.addEventListener('click', () => navigate('/settings'));

  document.getElementById('history-list')?.addEventListener('click', (e) => {
    const item = e.target.closest('.history-item');
    if (!item) return;
    const id = item.dataset.id;
    if (e.target.closest('.history-del')) {
      deleteConvo(id);
      renderHistoryList();
      return;
    }
    loadConvo(id);
    navigate('/');
  });
}

export function renderHistoryList() {
  const el = document.getElementById('history-list');
  if (!el) return;
  el.innerHTML = renderHistoryItems();
}

function renderHistoryItems() {
  if (!state.conversations.length) {
    return '<div style="text-align:center;color:var(--ink35);font-size:12px;padding:20px 0;font-style:italic">لا توجد محادثات بعد</div>';
  }
  return state.conversations.map(c => `
    <div class="history-item ${c.id === state.currentConvoId ? 'active' : ''}" data-id="${c.id}">
      <span style="opacity:.4;font-size:10px">✦</span>
      <span style="flex:1">${escapeHtml(c.title)}</span>
      <span class="history-del" style="opacity:0;font-size:10px;cursor:pointer;transition:opacity .15s" title="حذف">✕</span>
    </div>
  `).join('');
}
