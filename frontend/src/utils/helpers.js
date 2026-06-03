export function escapeHtml(t) {
  if (typeof t !== 'string') return '';
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function needsWebSearch(text) {
  if (typeof text !== 'string') return false;
  if (text.trim().length < 15) return false;
  if (/^(ok|okay|thanks|شكرا|تمام|نعم|لا|yes|no|hi|مرحبا|هلا|صح|بالضبط|ممتاز|رائع|جيد|كيف حالك|i fixed|fixed it|cool|got it|understood|clear)/i.test(text.trim())) return false;
  return true;
}

export function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}
