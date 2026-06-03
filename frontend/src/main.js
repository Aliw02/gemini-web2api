import { route, navigate, init } from './router.js';
import { state } from './store.js';
import * as Storage from './services/storage.js';

import chatPage from './pages/ChatPage.js';
import historyPage from './pages/HistoryPage.js';
import settingsPage from './pages/SettingsPage.js';
import skillsPage from './pages/SkillsPage.js';

import './styles/tokens.css';
import './styles/base.css';
import './styles/chat.css';
import './styles/panels.css';
import './styles/responsive.css';

function bootstrap() {
  try {
    document.documentElement.setAttribute('data-theme', state.currentTheme);

    route('/', chatPage);
    route('/history', historyPage);
    route('/settings', settingsPage);
    route('/skills', skillsPage);

    init('/');
  } catch (err) {
    console.error('Boot error:', err);
    document.getElementById('app').innerHTML = '<p style="padding:40px;color:red">⚠️ تعذّر تحميل التطبيق: ' + err.message + '</p>';
  }
}

bootstrap();
