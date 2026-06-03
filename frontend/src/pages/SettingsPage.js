import { renderSidebar, initSidebar } from '../components/Sidebar.js';
import { renderHeader, bindHeaderEvents, MODELS, updateModelDisplay } from '../components/Header.js';
import { showToast } from '../components/Toast.js';
import { openPanel, bindPanelEvents, renderAllPanels } from '../components/Panels.js';
import { state, notify } from '../store.js';
import * as Storage from '../services/storage.js';
import { getConfig, saveConfig } from '../services/api.js';
import { escapeHtml } from '../utils/helpers.js';

export default function settingsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <main id="main">
      ${renderHeader()}
      <div class="main-area page-view">
        <div class="settings-page">
          <h1 style="font-family:'Playfair Display',serif;font-size:28px;color:var(--ink);margin-bottom:4px">⚙️ الإعدادات</h1>
          <p style="font-size:13px;color:var(--ink60);font-style:italic;margin-bottom:28px">تخصيص تجربة ألي AI</p>

          <!-- Server Config -->
          <div class="settings-section">
            <div class="settings-section-title">🔌 إعدادات الخادم</div>
            <div class="settings-section-desc">رابط الخادم ومفتاح API للاتصال بالخادم الخلفي</div>
            <div class="settings-card">
              <div class="config-field">
                <label class="config-label">رابط الخادم (API Base URL)</label>
                <input class="config-input" id="srv-url" value="${escapeHtml(getConfig().baseUrl)}" placeholder="http://localhost:8081">
              </div>
              <div class="config-field">
                <label class="config-label">مفتاح API (اختياري)</label>
                <input class="config-input" id="srv-key" value="${escapeHtml(getConfig().apiKey)}" placeholder="sk-...">
              </div>
              <button class="config-save" id="srv-save">💾 حفظ</button>
            </div>
          </div>

          <!-- Model -->
          <div class="settings-section">
            <div class="settings-section-title">🤖 النموذج</div>
            <div class="settings-section-desc">اختر نموذج الذكاء الاصطناعي للمحادثة</div>
            <div class="settings-card">
              <div style="display:flex;flex-direction:column;gap:8px">
                ${MODELS.map(m => `
                  <label style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border-radius:4px;cursor:pointer;transition:background .15s" class="model-option" data-id="${m.id}">
                    <input type="radio" name="settings-model" value="${m.id}" ${m.id === state.currentModel ? 'checked' : ''} style="accent-color:var(--gold2)">
                    <div>
                      <div style="font-size:14px;font-weight:600;color:var(--ink)">${m.label}</div>
                      <div style="font-size:11px;color:var(--ink60);direction:ltr;text-align:left">${m.id}</div>
                    </div>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- System Prompt -->
          <div class="settings-section">
            <div class="settings-section-title">📝 تعليمات النظام</div>
            <div class="settings-section-desc">توجيهات مخصصة ترسل قبل كل محادثة</div>
            <div class="settings-card">
              <textarea class="sysprompt-textarea" id="sp-input" placeholder="اكتب تعليماتك هنا…">${escapeHtml(state.systemPrompt)}</textarea>
              <div style="display:flex;gap:8px;margin-top:10px">
                <button class="config-save" id="sp-save">💾 حفظ</button>
                <button class="sysprompt-reset" id="sp-reset">↺ إعادة</button>
              </div>
            </div>
          </div>

          <!-- About -->
          <div class="settings-section">
            <div class="settings-section-title">ℹ️ حول ألي AI</div>
            <div class="settings-section-desc">معلومات عن المشروع</div>
            <div class="settings-card" style="text-align:center">
              <div style="font-family:'Playfair Display',serif;font-size:32px;font-weight:900;color:var(--ink)">ألي AI</div>
              <div style="font-style:italic;color:var(--ink60);margin-bottom:10px;font-family:'IM Fell English',serif">The Ali Intelligence — Est. 2026</div>
              <div style="font-size:13px;color:var(--ink60);line-height:1.7">
                واجهة محادثة مجانية تعمل عبر Gemini<br>
                <span style="font-size:11px">v2.0 · <a href="https://github.com" target="_blank" style="color:var(--accent)">GitHub</a> · ${
                  state.conversations.length > 0
                    ? state.conversations.reduce((sum, c) => sum + (c.messages?.length || 0), 0) + ' رسالة'
                    : 'ابدأ محادثة الآن'
                }</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    ${renderAllPanels()}
  `;

  initSidebar();
  bindHeaderEvents(openPanel);
  bindPanelEvents();
  bindSettingsEvents();

  return () => {};
}

function bindSettingsEvents() {
  document.getElementById('srv-save')?.addEventListener('click', () => {
    const url = document.getElementById('srv-url')?.value?.trim() || '';
    const key = document.getElementById('srv-key')?.value?.trim() || '';
    saveConfig({ baseUrl: url, apiKey: key });
    showToast('تم حفظ إعدادات الخادم ✦');
  });

  document.querySelectorAll('.model-option').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (!id) return;
      el.querySelector('input').checked = true;
      state.currentModel = id;
      Storage.setModel(id);
      updateModelDisplay();
      showToast('تم تغيير النموذج ✦');
    });
  });

  document.getElementById('sp-save')?.addEventListener('click', () => {
    const input = document.getElementById('sp-input');
    if (!input) return;
    state.systemPrompt = input.value;
    Storage.setSysPrompt(input.value);
    showToast('تم حفظ التعليمات ✦');
  });

  document.getElementById('sp-reset')?.addEventListener('click', () => {
    const input = document.getElementById('sp-input');
    if (!input) return;
    input.value = '';
    state.systemPrompt = '';
    Storage.setSysPrompt('');
    showToast('تم إعادة التعليمات ✦');
  });
}
