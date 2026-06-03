import { state } from '../store.js';

const MODELS = [
  { id: 'gemini-3.5-flash',               label: 'Flash 3.5' },
  { id: 'gemini-3.5-flash-thinking',      label: 'Flash 3.5 Thinking' },
  { id: 'gemini-3.5-flash-thinking-lite', label: 'Flash 3.5 Lite' },
  { id: 'gemini-3.1-pro',                 label: 'Pro 3.1' },
  { id: 'gemini-auto',                    label: 'Auto' },
  { id: 'gemini-flash-lite',              label: 'Flash Lite' },
];

export function getModelLabel() {
  const m = MODELS.find(x => x.id === state.currentModel) || MODELS[0];
  return m.label;
}

export { MODELS };

export function renderHeader() {
  return `
    <header id="header">
      <div class="header-right">
        <button class="toggle-btn" id="toggle-sidebar">☰</button>
        <div class="header-brand">
          <div class="header-stamp">ألي</div>
          <div>
            <div class="header-name">ألي AI</div>
            <div class="header-sub"><div class="status-dot"></div>متصل — جاهز</div>
          </div>
        </div>
      </div>
      <div class="header-left">
        <button class="hdr-btn" id="hdr-sysprompt" title="تعليمات النظام">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          التعليمات
        </button>
        <button class="hdr-btn" id="hdr-server" title="إعدادات الخادم">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
          الخادم
        </button>
        <button class="hdr-btn" id="hdr-theme">🎨 السمة</button>
        <button class="hdr-btn" id="hdr-export">📤 تصدير</button>
        <button class="hdr-btn" id="hdr-model">🤖 النموذج</button>
        <button class="hdr-btn" id="hdr-think">🧠 التفكير</button>
        <div class="edition-tag" id="edition-tag">ألي ${getModelLabel()}</div>
      </div>
    </header>
  `;
}

export function bindHeaderEvents(openPanel) {
  document.getElementById('toggle-sidebar')?.addEventListener('click', () => {
    state.sidebarOpen = !state.sidebarOpen;
    document.getElementById('sidebar')?.classList.toggle('collapsed', !state.sidebarOpen);
  });
  document.getElementById('hdr-theme')?.addEventListener('click', () => openPanel('theme-panel'));
  document.getElementById('hdr-export')?.addEventListener('click', () => openPanel('export-panel'));
  document.getElementById('hdr-model')?.addEventListener('click', () => openPanel('model-panel'));
  document.getElementById('hdr-think')?.addEventListener('click', () => openPanel('think-panel'));
  document.getElementById('hdr-sysprompt')?.addEventListener('click', () => openPanel('sysprompt-panel'));
  document.getElementById('hdr-server')?.addEventListener('click', () => openPanel('server-panel'));
}

export function updateModelDisplay() {
  const tag = document.getElementById('edition-tag');
  const foot = document.getElementById('sidebar-model');
  const label = getModelLabel();
  if (tag) tag.textContent = 'ألي ' + label;
  if (foot) foot.textContent = 'مدعوم بـ ' + label + ' · مجاناً بالكامل';
}
