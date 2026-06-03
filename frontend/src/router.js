const routes = {};
let currentPage = null;
let currentCleanup = null;

function route(path, page) {
  routes[path] = page;
}

function navigate(path) {
  if (currentCleanup) currentCleanup();
  currentPage = path;
  window.location.hash = path;
  const page = routes[path];
  if (page) {
    currentCleanup = page();
  }
}

function init(defaultPath) {
  window.addEventListener('hashchange', () => {
    const path = window.location.hash.slice(1) || defaultPath;
    if (currentCleanup) currentCleanup();
    currentPage = path;
    const page = routes[path];
    if (page) currentCleanup = page();
  });
  const initial = window.location.hash.slice(1) || defaultPath;
  if (routes[initial]) {
    currentPage = initial;
    currentCleanup = routes[initial]();
  }
}

export { route, navigate, init };
