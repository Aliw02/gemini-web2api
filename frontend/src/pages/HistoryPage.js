import { renderSidebar, initSidebar, renderHistoryList } from '../components/Sidebar.js';
import { renderHeader, bindHeaderEvents, updateModelDisplay } from '../components/Header.js';
import { showToast } from '../components/Toast.js';
import { openPanel, closeAllPanels, bindPanelEvents, renderAllPanels } from '../components/Panels.js';
import { state, loadConvo, deleteConvo } from '../store.js';
import { navigate } from '../router.js';
import { escapeHtml } from '../utils/helpers.js';

let unsub = null;

export default function historyPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <main id="main">
      ${renderHeader()}
      <div class="main-area page-view">
        <div class="history-page">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h1 style="font-family:'Playfair Display',serif;font-size:24px;color:var(--ink)">📋 سجل المحادثات</h1>
            <button class="hdr-btn" id="back-chat">← العودة للمحادثة</button>
          </div>

          <input class="history-search" id="history-search" type="text" placeholder="🔍 ابحث في المحادثات…">

          <div style="margin-bottom:16px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span style="font-size:12px;color:var(--ink60);font-weight:700">المجلدات:</span>
            <select class="config-input" id="folder-filter" style="width:auto;min-width:140px">
              <option value="">الكل</option>
              ${renderFolderOptions()}
            </select>
            <input class="config-input" id="new-folder-input" style="width:auto;min-width:120px" placeholder="مجلد جديد…">
            <button class="tool-btn" id="add-folder-btn">＋ إضافة</button>
          </div>

          <div class="history-page-list" id="history-page-list">
            ${renderHistoryPageItems('')}
          </div>
        </div>
      </div>
    </main>
    ${renderAllPanels()}
  `;

  initSidebar();
  bindHeaderEvents(openPanel);
  bindPanelEvents();
  bindHistoryEvents();

  return () => {};
}

function renderFolderOptions() {
  return state.folders.map(f => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join('');
}

function renderHistoryPageItems(filter) {
  let convos = state.conversations;

  if (filter) {
    const f = filter.toLowerCase();
    convos = convos.filter(c => {
      const title = (c.title || '').toLowerCase();
      const content = c.messages?.map(m => (m.display || m.content || '')).join(' ').toLowerCase();
      return title.includes(f) || content.includes(f);
    });
  }

  if (!convos.length) {
    return '<div class="history-page-empty">لا توجد محادثات تطابق بحثك</div>';
  }

  return convos.map(c => {
    const msgCount = c.messages?.length || 0;
    const lastDate = c.messages?.[c.messages.length - 1]
      ? new Date(parseInt(c.id?.slice(2)) || Date.now()).toLocaleDateString('ar-SA')
      : '';
    return `
      <div class="history-page-item" data-id="${c.id}">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:10px">✦</span>
          <div style="flex:1">
            <div class="history-page-title">${escapeHtml(c.title || 'بدون عنوان')}</div>
            <div class="history-page-meta">
              <span>${msgCount} رسالة</span>
              <span>${lastDate}</span>
            </div>
          </div>
          <button class="tool-btn history-del-page" data-id="${c.id}" style="color:var(--danger)">✕ حذف</button>
        </div>
      </div>
    `;
  }).join('');
}

function bindHistoryEvents() {
  document.getElementById('back-chat')?.addEventListener('click', () => navigate('/'));

  const searchInput = document.getElementById('history-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const list = document.getElementById('history-page-list');
        if (list) list.innerHTML = renderHistoryPageItems(searchInput.value);
      }, 200);
    });
  }

  document.getElementById('history-page-list')?.addEventListener('click', (e) => {
    const item = e.target.closest('.history-page-item');
    const delBtn = e.target.closest('.history-del-page');
    if (delBtn) {
      const id = delBtn.dataset.id;
      deleteConvo(id);
      const list = document.getElementById('history-page-list');
      if (list) list.innerHTML = renderHistoryPageItems(document.getElementById('history-search')?.value || '');
      renderHistoryList();
      showToast('تم حذف المحادثة');
      return;
    }
    if (item) {
      const id = item.dataset.id;
      loadConvo(id);
      navigate('/');
    }
  });

  document.getElementById('add-folder-btn')?.addEventListener('click', () => {
    const input = document.getElementById('new-folder-input');
    if (!input || !input.value.trim()) return;
    const name = input.value.trim();
    if (!state.folders.includes(name)) {
      state.folders.push(name);
      import('../store.js').then(m => m.saveFolders());
      input.value = '';
      const select = document.getElementById('folder-filter');
      if (select) select.innerHTML = `<option value="">الكل</option>${renderFolderOptions()}`;
      showToast('تم إضافة المجلد ✦');
    }
  });
}
