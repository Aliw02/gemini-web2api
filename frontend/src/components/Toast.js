let timeout = null;

export function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(timeout);
  timeout = setTimeout(() => el.classList.remove('show'), 2200);
}
