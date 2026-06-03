import * as Storage from './services/storage.js';

const state = {
  conversations: Storage.getConvos(),
  currentConvoId: null,
  messages: [],
  currentTheme: Storage.getTheme(),
  currentModel: Storage.getModel(),
  webSearchOn: Storage.getWebSearch(),
  urlFetchOn: Storage.getUrlFetch(),
  systemPrompt: Storage.getSysPrompt(),
  isLoading: false,
  sidebarOpen: true,
  lastWebSources: [],
  urlCache: new Map(),
  folders: Storage.getFolders(),
  editingMsgIdx: -1,
  listeners: [],
};

function subscribe(fn) {
  state.listeners.push(fn);
  return () => {
    state.listeners = state.listeners.filter(l => l !== fn);
  };
}

function notify() {
  for (const fn of state.listeners) fn(state);
}

function saveConvo() {
  if (!state.currentConvoId || !state.messages.length) return;
  const raw = state.messages[0].display || state.messages[0].content;
  const title = raw.slice(0, 42) + (raw.length > 42 ? '…' : '');
  const cleanMsgs = state.messages.map(m => ({
    ...m,
    content: m.display ? _stripInjected(m.content) : m.content,
  }));
  const idx = state.conversations.findIndex(c => c.id === state.currentConvoId);
  const data = { id: state.currentConvoId, title, messages: cleanMsgs };
  if (idx >= 0) state.conversations[idx] = data;
  else state.conversations.unshift(data);
  Storage.setConvos(state.conversations);
  notify();
}

function _stripInjected(content) {
  return content
    .replace(/\[\s*محتوى الروابط المرفقة[\s\S]*?انتهى محتوى الروابط\s*\]/g, '')
    .replace(/\[\s*نتائج البحث الحية من الإنترنت[\s\S]*?انتهت نتائج البحث[\s\S]*?\]/g, '')
    .trim();
}

function loadConvo(id) {
  const c = state.conversations.find(c => c.id === id);
  if (!c) return;
  state.currentConvoId = id;
  state.messages = c.messages;
  notify();
}

function newChat() {
  state.currentConvoId = 'c_' + Date.now();
  state.messages = [];
  state.urlCache.clear();
  notify();
}

function deleteConvo(id) {
  state.conversations = state.conversations.filter(c => c.id !== id);
  Storage.setConvos(state.conversations);
  if (state.currentConvoId === id) newChat();
  else notify();
}

function addMessage(msg) {
  state.messages.push(msg);
}

function updateMessage(index, overrides) {
  if (index >= 0 && index < state.messages.length) {
    state.messages[index] = { ...state.messages[index], ...overrides };
  }
}

function removeLastAssistant() {
  const idx = state.messages.map(m => m.role).lastIndexOf('assistant');
  if (idx >= 0) state.messages.splice(idx, 1);
  return idx;
}

function setLoading(v) {
  state.isLoading = v;
  notify();
}

function saveFolders() {
  Storage.setFolders(state.folders);
}

export {
  state,
  subscribe,
  notify,
  saveConvo,
  loadConvo,
  newChat,
  deleteConvo,
  addMessage,
  updateMessage,
  removeLastAssistant,
  setLoading,
  saveFolders,
};
