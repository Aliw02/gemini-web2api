const CONVOS_KEY = 'ali_convos_v2';
const THEME_KEY = 'ali_theme';
const MODEL_KEY = 'ali_model';
const WEB_SEARCH_KEY = 'ali_webSearch';
const URL_FETCH_KEY = 'ali_urlFetch';
const SYSPROMPT_KEY = 'ali_sysprompt';
const FOLDERS_KEY = 'ali_folders';

function getConvos() {
  try { return JSON.parse(localStorage.getItem(CONVOS_KEY)) || []; }
  catch { return []; }
}

function setConvos(convos) {
  localStorage.setItem(CONVOS_KEY, JSON.stringify(convos.slice(0, 100)));
}

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'paper';
}

function setTheme(t) {
  localStorage.setItem(THEME_KEY, t);
}

function getModel() {
  const saved = localStorage.getItem(MODEL_KEY);
  const valid = ['gemini-3.5-flash','gemini-3.5-flash-thinking','gemini-3.5-flash-thinking-lite','gemini-3.1-pro','gemini-auto','gemini-flash-lite'];
  return valid.includes(saved) ? saved : 'gemini-3.5-flash';
}

function setModel(m) {
  localStorage.setItem(MODEL_KEY, m);
}

function getWebSearch() {
  const v = localStorage.getItem(WEB_SEARCH_KEY);
  return v === null ? true : JSON.parse(v);
}

function setWebSearch(v) {
  localStorage.setItem(WEB_SEARCH_KEY, JSON.stringify(v));
}

function getUrlFetch() {
  const v = localStorage.getItem(URL_FETCH_KEY);
  return v === null ? true : JSON.parse(v);
}

function setUrlFetch(v) {
  localStorage.setItem(URL_FETCH_KEY, JSON.stringify(v));
}

function getSysPrompt() {
  return localStorage.getItem(SYSPROMPT_KEY) || '';
}

function setSysPrompt(v) {
  localStorage.setItem(SYSPROMPT_KEY, v);
}

function getFolders() {
  try { return JSON.parse(localStorage.getItem(FOLDERS_KEY)) || []; }
  catch { return []; }
}

function setFolders(f) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(f));
}

export {
  getConvos, setConvos,
  getTheme, setTheme,
  getModel, setModel,
  getWebSearch, setWebSearch,
  getUrlFetch, setUrlFetch,
  getSysPrompt, setSysPrompt,
  getFolders, setFolders,
};
