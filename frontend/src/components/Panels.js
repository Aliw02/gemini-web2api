import { state, notify, saveFolders } from '../store.js';
import { MODELS, getModelLabel, updateModelDisplay } from './Header.js';
import { renderHistoryList } from './Sidebar.js';
import { showToast } from './Toast.js';
import { getConfig, saveConfig } from '../services/api.js';
import * as Storage from '../services/storage.js';

let openPanelId = null;

function onDocumentClick(e) {
  if (!openPanelId) return;
  const panel = document.getElementById(openPanelId);
  if (panel && !panel.contains(e.target) && !e.target.closest('.hdr-btn')) {
    closeAllPanels();
  }
}

function onKeyDown(e) {
  if (e.key === 'Escape' && openPanelId) closeAllPanels();
}

export function openPanel(id) {
  if (openPanelId === id) { closeAllPanels(); return; }
  closeAllPanels();
  const panel = document.getElementById(id);
  if (!panel) return;
  panel.style.display = 'block';
  requestAnimationFrame(() => {
    panel.classList.add('open');
  });
  openPanelId = id;
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeyDown);
}

export function closeAllPanels() {
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.remove('open');
    setTimeout(() => {
      if (!p.classList.contains('open')) p.style.display = 'none';
    }, 300);
  });
  openPanelId = null;
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onKeyDown);
}

export function bindPanelOverlay() {
  // panels now close via click-outside; no overlay needed
}

export function renderThemePanel() {
  const themes = [
    { id: 'paper', label: 'ورقي', sub: 'Paper — الكلاسيكي', swatch: 'swatch-paper', bg: '#F4EFE4', fg: '#1C1409' },
    { id: 'night', label: 'ليلي', sub: 'Night — الداكن', swatch: 'swatch-night', bg: '#141008', fg: '#EDE6D6' },
    { id: 'sepia', label: 'سيبيا', sub: 'Sepia — الدافئ', swatch: 'swatch-sepia', bg: '#F0E2C8', fg: '#2D1A06' },
    { id: 'slate', label: 'أردوازي', sub: 'Slate — الرسمي', swatch: 'swatch-slate', bg: '#F0F2F5', fg: '#12192B' },
  ];

  return `
    <div class="panel" id="theme-panel" style="display:none">
      <div class="panel-header">
        <div class="panel-title">اختر السمة</div>
        <button class="panel-close" id="close-theme">✕</button>
      </div>
      <div class="theme-grid">
        ${themes.map(t => `
          <div class="theme-swatch ${t.swatch} ${t.id === state.currentTheme ? 'active' : ''}" data-theme="${t.id}">
            <div class="swatch-preview" style="background:${t.bg};color:${t.fg}">
              <div class="swatch-lines"></div>
              <div class="swatch-stamp" style="background:${t.fg};color:${t.bg}">ألي</div>
              <div class="swatch-name">${t.label}</div>
              <div class="swatch-sub">${t.sub}</div>
            </div>
            <div class="swatch-check">✦</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderModelPanel() {
  return `
    <div class="panel" id="model-panel" style="display:none">
      <div class="panel-header">
        <div class="panel-title">اختر النموذج</div>
        <button class="panel-close" id="close-model">✕</button>
      </div>
      <div class="model-list" id="model-list">
        ${MODELS.map(m => `
          <div class="model-item ${m.id === state.currentModel ? 'active' : ''}" data-id="${m.id}">
            <div class="model-item-main">
              <div class="model-name">${m.label}</div>
              <div class="model-id">${m.id}</div>
            </div>
            <div class="model-check">✦</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderThinkPanel() {
  const currentThink = state.currentThinkLevel ?? 2;
  const marks = [
    { val: 0, label: 'عميق' },
    { val: 1, label: 'متوسط' },
    { val: 2, label: 'عادي' },
    { val: 3, label: 'خفيف' },
    { val: 4, label: 'سريع' },
  ];

  return `
    <div class="panel" id="think-panel" style="display:none">
      <div class="panel-header">
        <div class="panel-title">🧠 عمق التفكير</div>
        <button class="panel-close" id="close-think">✕</button>
      </div>
      <div class="panel-body">
        <div class="think-desc">للنماذج المفكّرة: تحكم في عمق التفكير قبل الإجابة</div>
        <div class="think-slider-wrap">
          <input type="range" class="think-slider" id="think-slider" min="0" max="4" value="${currentThink}" step="1">
          <div class="think-marks">
            ${marks.map(m => `<div class="think-mark ${m.val === currentThink ? 'active' : ''}" data-val="${m.val}">${m.label}</div>`).join('')}
          </div>
          <div class="think-current" id="think-current">${marks[currentThink].label}</div>
        </div>
      </div>
    </div>
  `;
}

export function renderExportPanel() {
  return `
    <div class="panel" id="export-panel" style="display:none">
      <div class="panel-header">
        <div class="panel-title">تصدير المحادثة</div>
        <button class="panel-close" id="close-export">✕</button>
      </div>
      <div class="export-list">
        <div class="export-item" id="export-pdf">
          <div class="export-icon">🖨️</div>
          <div>
            <div class="export-label">تصدير PDF</div>
            <div class="export-desc">طباعة أو حفظ كملف PDF</div>
          </div>
        </div>
        <div class="export-item" id="export-txt">
          <div class="export-icon">📄</div>
          <div>
            <div class="export-label">تصدير TXT</div>
            <div class="export-desc">حفظ النص الخام</div>
          </div>
        </div>
        <div class="export-item" id="export-md">
          <div class="export-icon">📝</div>
          <div>
            <div class="export-label">تصدير Markdown</div>
            <div class="export-desc">حفظ بصيغة Markdown</div>
          </div>
        </div>
        <div class="export-item" id="export-copy">
          <div class="export-icon">📋</div>
          <div>
            <div class="export-label">نسخ الكل</div>
            <div class="export-desc">نسخ جميع الرسائل</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderSysPromptPanel() {
  return `
    <div class="panel" id="sysprompt-panel" style="display:none">
      <div class="panel-header">
        <div class="panel-title">📝 تعليمات النظام</div>
        <button class="panel-close" id="close-sysprompt">✕</button>
      </div>
      <div class="panel-body">
        <textarea class="sysprompt-textarea" id="sysprompt-input">${escapeHtml(state.systemPrompt)}</textarea>
        <div class="sysprompt-hint">هذه التعليمات ترسل قبل كل محادثة لتوجيه سلوك الذكاء الاصطناعي</div>
        <div class="sysprompt-actions">
          <button class="sysprompt-save" id="sysprompt-save">💾 حفظ</button>
          <button class="sysprompt-reset" id="sysprompt-reset">↺ إعادة افتراضي</button>
        </div>
      </div>
    </div>
  `;
}

export function renderServerPanel() {
  const cfg = getConfig();
  return `
    <div class="panel" id="server-panel" style="display:none">
      <div class="panel-header">
        <div class="panel-title">⚙️ إعدادات الخادم</div>
        <button class="panel-close" id="close-server">✕</button>
      </div>
      <div class="panel-body">
        <div class="config-field">
          <label class="config-label">رابط الخادم (API Base URL)</label>
          <input class="config-input" id="config-url" value="${escapeHtml(cfg.baseUrl)}" placeholder="http://localhost:8081">
        </div>
        <div class="config-field">
          <label class="config-label">مفتاح API (اختياري)</label>
          <input class="config-input" id="config-key" value="${escapeHtml(cfg.apiKey)}" placeholder="sk-...">
        </div>
        <button class="config-save" id="config-save">💾 حفظ الإعدادات</button>
      </div>
    </div>
  `;
}

export function bindPanelEvents() {
  document.getElementById('close-theme')?.addEventListener('click', closeAllPanels);
  document.getElementById('close-model')?.addEventListener('click', closeAllPanels);
  document.getElementById('close-think')?.addEventListener('click', closeAllPanels);
  document.getElementById('close-export')?.addEventListener('click', closeAllPanels);
  document.getElementById('close-sysprompt')?.addEventListener('click', closeAllPanels);
  document.getElementById('close-server')?.addEventListener('click', closeAllPanels);

  document.querySelectorAll('.theme-swatch').forEach(el => {
    el.addEventListener('click', () => {
      const theme = el.dataset.theme;
      if (!theme) return;
      state.currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      Storage.setTheme(theme);
      document.querySelectorAll('.theme-swatch').forEach(s => s.classList.toggle('active', s.dataset.theme === theme));
      showToast('تم تغيير السمة ✦');
      closeAllPanels();
    });
  });

  document.querySelectorAll('.model-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset?.id;
      if (!id) return;
      state.currentModel = id;
      Storage.setModel(id);
      updateModelDisplay();
      document.querySelectorAll('.model-item').forEach(m => m.classList.toggle('active', m.dataset?.id === id));
      const m = MODELS.find(x => x.id === id) || MODELS[0];
      showToast('النموذج: ' + m.label + ' ✦');
      closeAllPanels();
    });
  });

  const slider = document.getElementById('think-slider');
  if (slider) {
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      state.currentThinkLevel = val;
      const marks = ['عميق', 'متوسط', 'عادي', 'خفيف', 'سريع'];
      document.querySelectorAll('.think-mark').forEach(m => m.classList.toggle('active', parseInt(m.dataset.val) === val));
      document.getElementById('think-current').textContent = marks[val];
    });
  }

  document.getElementById('export-pdf')?.addEventListener('click', () => {
    closeAllPanels();
    setTimeout(() => window.print(), 300);
  });

  document.getElementById('export-txt')?.addEventListener('click', () => {
    closeAllPanels();
    import('../services/export.js').then(m => m.exportTXT(state.messages));
    showToast('تم تصدير TXT ✦');
  });

  document.getElementById('export-md')?.addEventListener('click', () => {
    closeAllPanels();
    import('../services/export.js').then(m => m.exportMarkdown(state.messages));
    showToast('تم تصدير Markdown ✦');
  });

  document.getElementById('export-copy')?.addEventListener('click', () => {
    closeAllPanels();
    import('../services/export.js').then(m => m.copyAll(state.messages));
    showToast('تم نسخ المحادثة ✦');
  });

  document.getElementById('sysprompt-save')?.addEventListener('click', () => {
    const input = document.getElementById('sysprompt-input');
    if (!input) return;
    state.systemPrompt = input.value;
    Storage.setSysPrompt(input.value);
    showToast('تم حفظ التعليمات ✦');
    closeAllPanels();
  });

  document.getElementById('sysprompt-reset')?.addEventListener('click', () => {
    const input = document.getElementById('sysprompt-input');
    if (!input) return;
    input.value = '';
    state.systemPrompt = '';
    Storage.setSysPrompt('');
    showToast('تم إعادة التعليمات ✦');
    closeAllPanels();
  });

  document.getElementById('config-save')?.addEventListener('click', () => {
    const url = document.getElementById('config-url')?.value?.trim() || '';
    const key = document.getElementById('config-key')?.value?.trim() || '';
    saveConfig({ baseUrl: url, apiKey: key });
    showToast('تم حفظ إعدادات الخادم ✦');
    closeAllPanels();
  });
}

export function renderAllPanels() {
  return [
    renderThemePanel(),
    renderModelPanel(),
    renderThinkPanel(),
    renderExportPanel(),
    renderSysPromptPanel(),
    renderServerPanel(),
  ].join('');
}

function escapeHtml(t) {
  if (typeof t !== 'string') return '';
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
