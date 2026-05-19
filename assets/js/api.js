const API = 'http://localhost:3000/api';

// ─── Loading Overlay ─────────────────────────────────────────────
(function injectLoader() {
  const style = document.createElement('style');
  style.textContent = `
    #api-page-loader {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(255,255,255,0.88);
      backdrop-filter: blur(4px);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 14px;
      transition: opacity 0.28s ease;
    }
    body.dark #api-page-loader { background: rgba(20,25,40,0.92); }
    #api-page-loader.apl-hide  { opacity: 0; pointer-events: none; }
    #api-page-loader.apl-gone  { display: none; }
    .apl-spinner {
      width: 44px; height: 44px;
      border: 3px solid rgba(0,119,184,0.2);
      border-top-color: #0077B8;
      border-radius: 50%;
      animation: apl-spin 0.7s linear infinite;
    }
    @keyframes apl-spin { to { transform: rotate(360deg); } }
    .apl-text {
      font-family: 'Segoe UI', Roboto, sans-serif;
      font-size: 14px; color: #6c7a89; letter-spacing: .3px;
    }
    body.dark .apl-text { color: #9ca3af; }
  `;
  document.head.appendChild(style);

  function createLoader() {
    if (document.getElementById('api-page-loader')) return;
    const el = document.createElement('div');
    el.id = 'api-page-loader';
    el.classList.add('apl-gone');
    el.innerHTML = '<div class="apl-spinner"></div><span class="apl-text">Loading...</span>';
    document.body.appendChild(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createLoader);
  } else {
    createLoader();
  }
})();

let _reqCount = 0;

function _showLoader() {
  _reqCount++;
  const el = document.getElementById('api-page-loader');
  if (!el) return;
  el.classList.remove('apl-gone', 'apl-hide');
}

function _hideLoader() {
  if (--_reqCount > 0) return;
  _reqCount = 0;
  const el = document.getElementById('api-page-loader');
  if (!el) return;
  el.classList.add('apl-hide');
  setTimeout(() => el.classList.add('apl-gone'), 300);
}

// ─── Token helpers ───────────────────────────────────────────────
const Auth = {
  save(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  token()   { return localStorage.getItem('token'); },
  user()    { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
  isLoggedIn() { return !!this.token(); },
  logout()  { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/html/login.html'; }
};

// ─── Base fetch wrapper ──────────────────────────────────────────
async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (Auth.token()) headers['Authorization'] = 'Bearer ' + Auth.token();

  _showLoader();
  try {
    const res = await fetch(API + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  } finally {
    _hideLoader();
  }
}

const get    = (path)        => request('GET',    path);
const post   = (path, body)  => request('POST',   path, body);
const put    = (path, body)  => request('PUT',    path, body);
const del    = (path)        => request('DELETE', path);

// ─── Auth API ────────────────────────────────────────────────────
async function register(name, email, password, role) {
  const data = await post('/auth/register', { name, email, password, role });
  Auth.save(data.token, data.user);
  return data;
}

async function login(email, password) {
  const data = await post('/auth/login', { email, password });
  Auth.save(data.token, data.user);
  return data;
}

async function getMe() {
  return get('/auth/me');
}

async function updateMe(body) {
  return put('/auth/me', body);
}

async function getMyProposals() {
  return get('/auth/my-proposals');
}

// ─── Posts API ───────────────────────────────────────────────────
// ─── Freelancers API ─────────────────────────────────────────────────────────
const getFreelancers = (params = '') => get('/freelancers' + (params ? '?' + params : ''));

// ─── Posts API ───────────────────────────────────────────────────────────────
const getPosts       = (params = '')        => get('/posts' + (params ? '?' + params : ''));
const getPost        = (id)                 => get('/posts/' + id);
const createPost     = (body)               => post('/posts', body);
const updatePost     = (id, body)           => put('/posts/' + id, body);
const deletePost     = (id)                 => del('/posts/' + id);
const getProposals   = (postId)             => get('/posts/' + postId + '/proposals');
const submitProposal = (postId, body)       => post('/posts/' + postId + '/proposals', body);

// ─── Admin Management API ────────────────────────────────────────
const getAdminStats      = ()     => get('/admin/stats');
const getAdminUsers      = ()     => get('/admin/users');
const getAdminAccounts   = ()     => get('/admin/accounts');
const addAdminAccount    = (body) => post('/admin/accounts', body);
const deleteAdminAccount = (id)   => del('/admin/accounts/' + id);

// ─── UI helpers ──────────────────────────────────────────────────
function showError(msg, containerId = 'error-msg') {
  const el = document.getElementById(containerId);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  else alert(msg);
}

function showSuccess(msg, containerId = 'success-msg') {
  const el = document.getElementById(containerId);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function updateNavUser() {
  const user = Auth.user();
  const loginBtn  = document.getElementById('nav-login');
  const signupBtn = document.getElementById('nav-signup');
  const userMenu  = document.getElementById('nav-user');
  const userName  = document.getElementById('nav-username');

  if (user) {
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (signupBtn) signupBtn.style.display = 'none';
    if (userMenu)  userMenu.style.display  = 'flex';
    if (userName)  userName.textContent    = user.name;
  }
}

// Run on every page load
document.addEventListener('DOMContentLoaded', updateNavUser);
