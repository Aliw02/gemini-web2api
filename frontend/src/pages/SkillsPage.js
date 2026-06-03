import { renderSidebar, initSidebar } from '../components/Sidebar.js';
import { renderHeader, bindHeaderEvents } from '../components/Header.js';
import { openPanel, bindPanelEvents, renderAllPanels } from '../components/Panels.js';
import { navigate } from '../router.js';
import { escapeHtml } from '../utils/helpers.js';

const SKILLS_DATA = [
  {
    title: '🔧 PRODUCTION ENGINEERING',
    skills: [
      { icon: '🚨', name: 'Outage Debugging', desc: 'PagerDuty 503s — find root cause in 30 min', template: '🏆 Your Role: Senior SRE on-call for an e-commerce platform doing $1M/day.\n🎯 Your Goal: Debug and resolve a production outage — checkout API returning 503 errors at 2 AM.\n📋 Context: Last deploy rolled out 2 hours ago. PagerDuty alert triggered. Grafana shows error rate spiking from 0.1% to 45%.' },
      { icon: '📈', name: 'Latency Crisis', desc: 'p99 120ms → 8s — find the bottleneck', template: '🏆 Your Role: Backend platform engineer for a B2B SaaS company with 10K API requests/sec.\n🎯 Your Goal: Investigate and fix a sudden p99 latency spike from 120ms to 8 seconds.' },
      { icon: '💾', name: 'Data Recovery', desc: 'Accidental DELETE on prod — PITR rescue', template: '🏆 Your Role: Senior DRE for fintech doing $5M/day.\n🎯 Your Goal: Recover accidentally deleted customer transaction records from production PostgreSQL.' },
      { icon: '⚡', name: 'Capacity Crisis', desc: '20x traffic spike — keep the site alive', template: '🏆 Your Role: Infrastructure engineer at a social media startup doing 10K req/s normally.\n🎯 Your Goal: Keep the platform online after a celebrity tweet sends traffic 20x above normal.' },
    ],
  },
  {
    title: '🏗️ SYSTEM ARCHITECTURE',
    skills: [
      { icon: '🔗', name: 'URL Shortener', desc: '100M URLs, 1B redirects/day', template: '🏆 Your Role: Staff engineer. Design a scalable URL shortener handling 100M URLs and 1B redirects/day with click analytics.' },
      { icon: '💬', name: 'Real-time Chat', desc: '10M users, 1M WebSockets', template: '🏆 Your Role: Principal engineer. Architect a real-time chat system with group chats, file sharing, typing indicators.' },
      { icon: '💳', name: 'Payment System', desc: '$10M/day, 50 countries', template: '🏆 Your Role: Payments infrastructure architect for global e-commerce.\n🎯 Design a reliable, idempotent, multi-currency payment processing system handling $10M/day across 50 countries.' },
      { icon: '🎬', name: 'Video Platform', desc: '10M viewers, 4K HDR', template: '🏆 Your Role: Media platform architect. Design a video streaming platform serving 10M concurrent viewers.' },
    ],
  },
  {
    title: '🔄 MIGRATION & REFACTORING',
    skills: [
      { icon: '🏗️', name: 'Monolith Breakup', desc: '500K Rails → microservices', template: '🏆 Your Role: Principal engineer. Break a 500K-line Rails monolith into microservices without stopping feature development.' },
      { icon: '🗄️', name: 'DB Migration', desc: '5TB MySQL → PostgreSQL', template: '🏆 Your Role: Senior data engineer. Migrate a 5TB MySQL database to PostgreSQL with zero downtime.' },
      { icon: '🔌', name: 'API Modernization', desc: '50 SOAP → REST/GraphQL', template: '🏆 Your Role: API architect. Modernize 50+ legacy SOAP APIs to REST/GraphQL.' },
    ],
  },
  {
    title: '📊 DATA PLATFORM',
    skills: [
      { icon: '📡', name: 'Real-time Pipeline', desc: '1M events/sec', template: '🏆 Your Role: Senior data engineer. Design a real-time analytics pipeline processing 1M events/sec.' },
      { icon: '🎯', name: 'Recommendation Engine', desc: '10M products, 100M users', template: '🏆 Your Role: ML platform engineer. Build a production recommendation system serving personalized suggestions in < 50ms.' },
    ],
  },
  {
    title: '🔐 SECURITY ENGINEERING',
    skills: [
      { icon: '🛡️', name: 'Breach Response', desc: '5TB PII leaked — contain', template: '🏆 Your Role: Senior security incident responder. Investigate and contain a data breach — AWS GuardDuty alert shows 5TB of PII downloaded.' },
      { icon: '🔑', name: 'Auth System', desc: 'OAuth 2.0 + OIDC + MFA', template: '🏆 Your Role: Platform security engineer. Design a multi-tenant auth system supporting SSO, MFA, social login.' },
    ],
  },
  {
    title: '🚀 PERFORMANCE & SRE',
    skills: [
      { icon: '🧪', name: 'Load Testing', desc: '100K users validation', template: '🏆 Your Role: Performance engineer. Design and execute a load testing strategy for 100K concurrent users.' },
      { icon: '⚡', name: 'Caching Strategy', desc: '80% DB load reduction', template: '🏆 Your Role: Backend engineer. Design a multi-layer caching strategy reducing DB read load by 80%.' },
    ],
  },
  {
    title: '📝 PRODUCTIVITY',
    skills: [
      { icon: '✍️', name: 'كتابة احترافية', desc: 'مقالات، رسائل، بريد إلكتروني', template: 'ساعدني في كتابة نص احترافي بالتنسيق المناسب للموضوع التالي:' },
      { icon: '🌐', name: 'ترجمة AR/EN', desc: 'ترجمة دقيقة', template: 'ترجم النص التالي بدقة مع الحفاظ على الأسلوب والسياق:' },
      { icon: '💻', name: 'كود Python', desc: 'كتابة وتصحيح', template: 'ساعدني في كتابة كود Python لحل المشكلة التالية:' },
      { icon: '📊', name: 'تحليل بيانات', desc: 'تحليل إحصائي', template: 'حلل البيانات التالية وقدّم رؤى وتوصيات قابلة للتنفيذ:' },
    ],
  },
];

export default function skillsPage() {
  const app = document.getElementById('app');
  app.innerHTML = `
    ${renderSidebar()}
    <main id="main">
      ${renderHeader()}
      <div class="main-area page-view">
        <div class="skills-page">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
            <h1 style="font-family:'Playfair Display',serif;font-size:24px;color:var(--ink)">✦ المكتبة المهنية</h1>
            <button class="hdr-btn" id="back-from-skills">← العودة</button>
          </div>

          <input class="skills-page-search" id="skills-search" placeholder="🔍 ابحث في المهارات…">

          <div id="skills-list">
            ${renderSkillsGroups('')}
          </div>
        </div>
      </div>
    </main>
    ${renderAllPanels()}
  `;

  initSidebar();
  bindHeaderEvents(openPanel);
  bindPanelEvents();
  bindSkillsEvents();

  return () => {};
}

function renderSkillsGroups(filter) {
  const lower = (filter || '').toLowerCase();
  return SKILLS_DATA.map(group => {
    if (filter) {
      const matching = group.skills.filter(s => s.name.toLowerCase().includes(lower) || s.desc.toLowerCase().includes(lower));
      if (!matching.length) return '';
      return `
        <div class="skills-section-title">${group.title}</div>
        <div class="skills-grid">
          ${matching.map(s => `
            <div class="skill-card" onclick="applySkillTemplate('${escapeHtml(s.template)}')">
              <span class="skill-icon">${s.icon}</span>
              <div class="skill-name">${s.name}</div>
              <div class="skill-desc">${s.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    return `
      <div class="skills-section-title">${group.title}</div>
      <div class="skills-grid">
        ${group.skills.map(s => `
          <div class="skill-card" onclick="applySkillTemplate('${escapeHtml(s.template)}')">
            <span class="skill-icon">${s.icon}</span>
            <div class="skill-name">${s.name}</div>
            <div class="skill-desc">${s.desc}</div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');
}

function bindSkillsEvents() {
  document.getElementById('back-from-skills')?.addEventListener('click', () => navigate('/'));

  const search = document.getElementById('skills-search');
  if (search) {
    let debounceTimer;
    search.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const list = document.getElementById('skills-list');
        if (list) list.innerHTML = renderSkillsGroups(search.value);
      }, 150);
    });
  }
}

window.applySkillTemplate = function(template) {
  navigate('/');
  setTimeout(() => {
    const input = document.getElementById('message-input');
    if (input) {
      input.value = template;
      input.focus();
      input.dispatchEvent(new Event('input'));
    }
  }, 100);
};
