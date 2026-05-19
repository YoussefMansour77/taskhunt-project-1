// assets/js/navbar.js — shared navbar for all TaskHunt pages
(function () {
  // ── Font Awesome (inject if missing) ─────────────────────────────
  if (!document.querySelector('link[href*="fontawesome"], link[href*="font-awesome"]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = '/assets/libs/fontawesome/css/all.min.css';
    document.head.appendChild(fa);
  }

  // ── Navbar CSS ────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .th-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 30px; height: 60px;
      background: #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      position: sticky; top: 0; z-index: 900;
      font-family: 'Inter','Segoe UI',sans-serif;
      box-sizing: border-box;
    }
    .th-nav .th-logo { display:flex; align-items:center; height:100%; flex-shrink:0; }
    .th-nav .th-logo img { height:38px; width:auto; display:block; object-fit:contain; }
    .th-nav .th-logo-text { font-size:20px; font-weight:800; color:#0077B8; letter-spacing:-0.5px; }
    .th-nav .th-links {
      display:flex; list-style:none; gap:28px; margin:0; padding:0;
      position:absolute; left:50%; transform:translateX(-50%);
    }
    .th-nav .th-links li a {
      text-decoration:none; color:#333; font-size:15px; font-weight:500;
      transition:color .2s;
    }
    .th-nav .th-links li a:hover { color:#0077B8; }
    .th-nav .th-right { display:flex; align-items:center; gap:14px; flex-shrink:0; }
    .th-btn { padding:8px 18px; border-radius:8px; border:none; cursor:pointer; font-size:14px; font-weight:600; transition:opacity .2s; }
    .th-btn:hover { opacity:.85; }
    .th-btn-login  { background:#f0f6ff; color:#0077B8; }
    .th-btn-signup { background:#0077B8;  color:#fff; }
    .th-profile-wrap { position:relative; cursor:pointer; }
    .th-avatar {
      width:36px; height:36px; border-radius:50%;
      background:#0090E0; color:#fff;
      display:flex; align-items:center; justify-content:center;
      font-weight:700; font-size:15px; overflow:hidden; user-select:none;
    }
    .th-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
    .th-prof-drop {
      display:none; position:absolute; top:44px; right:0;
      min-width:180px; background:#fff; border-radius:12px;
      box-shadow:0 8px 28px rgba(0,0,0,0.13); border:1px solid #eee;
      overflow:hidden; z-index:2000;
    }
    .th-profile-wrap:hover .th-prof-drop { display:block; }
    .th-prof-drop .th-drop-name {
      display:block; padding:10px 16px; font-weight:700; color:#051923;
      border-bottom:1px solid #eee; font-size:13px;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .th-prof-drop a {
      display:block; padding:10px 16px; color:#051923;
      text-decoration:none; font-size:13px; transition:background .15s;
    }
    .th-prof-drop a:hover { background:#f0f6ff; }
    .th-prof-drop a.th-logout { color:#e53e3e; }
    .th-nav .th-toggle { display:none; font-size:22px; cursor:pointer; color:#333; background:none; border:none; }
    @media (max-width:768px) {
      .th-nav .th-links {
        display:none; flex-direction:column; gap:0;
        position:fixed; top:60px; left:0; right:0;
        background:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.1);
        transform:none; padding:8px 0; z-index:899;
      }
      .th-nav .th-links.open { display:flex; }
      .th-nav .th-links li a { padding:12px 24px; display:block; font-size:16px; }
      .th-nav .th-toggle { display:block; }
    }
  `;
  document.head.appendChild(style);

  // ── Nav HTML ──────────────────────────────────────────────────────
  const nav = document.createElement('nav');
  nav.className = 'th-nav';
  nav.innerHTML = `
    <div class="th-logo">
      <a href="/html/home.html">
        <img src="/assets/images/logo.png" alt="TaskHunt"
             onerror="this.style.display='none';this.parentElement.innerHTML='<span class=th-logo-text>TaskHunt</span>'">
      </a>
    </div>
    <ul class="th-links" id="thLinks">
      <li><a href="/html/work.html">Find Work</a></li>
      <li><a href="/html/hie-talent.html">Hire Talent</a></li>
      <li><a href="/html/about.html">About</a></li>
      <li><a href="/html/contact-us.html">Contact</a></li>
    </ul>
    <div class="th-right" id="thRight">
      <button class="th-btn th-btn-login"  onclick="location.href='/html/login.html'">Login</button>
      <button class="th-btn th-btn-signup" onclick="location.href='/html/signup/ask-signup.html'">Sign Up</button>
    </div>
    <button class="th-toggle" id="thToggle">☰</button>
  `;

  // Insert as first child of body (or before first element)
  if (document.body) {
    document.body.insertBefore(nav, document.body.firstChild);
  } else {
    document.addEventListener('DOMContentLoaded', () =>
      document.body.insertBefore(nav, document.body.firstChild));
  }

  // Hide existing old navs after DOM ready
  function hideOldNavs() {
    document.querySelectorAll('nav:not(.th-nav)').forEach(n => n.style.display = 'none');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideOldNavs);
  } else {
    hideOldNavs();
  }

  // Mobile toggle
  document.getElementById('thToggle').onclick = () =>
    document.getElementById('thLinks').classList.toggle('open');

  // ── Auth init ─────────────────────────────────────────────────────
  function initNav() {
    if (typeof Auth === 'undefined' || !Auth.isLoggedIn()) return;
    const user = Auth.user();
    const right = document.getElementById('thRight');
    if (!right) return;

    const dashUrl = user.role === 'client'
      ? '/html/dashboard/dash-client.html'
      : '/html/dashboard/freelancer.html';
    const extraHtml = user.role === 'client'
      ? `<a href="/html/post-a-job.html" style="color:#0090E0;font-weight:600;">+ Post a Job</a>`
      : `<a href="/html/work.html"       style="color:#0090E0;font-weight:600;">Browse Jobs</a>`;

    right.innerHTML = `
      <div style="position:relative;cursor:pointer;" onclick="location.href='${dashUrl}'" title="Notifications">
        <i class="fa-solid fa-bell" style="font-size:20px;color:#555;"></i>
        <span id="thNotifBadge" style="display:none;position:absolute;top:-5px;right:-6px;
          background:#ef4444;color:#fff;font-size:10px;font-weight:700;
          min-width:17px;height:17px;border-radius:9px;padding:0 4px;
          align-items:center;justify-content:center;"></span>
      </div>
      <div id="thMsgWrap" style="position:relative;cursor:pointer;" onclick="thToggleMsg(event)" title="Messages">
        <i class="fa-solid fa-comment-dots" style="font-size:20px;color:#555;"></i>
        <span id="thMsgBadge" style="display:none;position:absolute;top:-5px;right:-6px;
          background:#22c55e;color:#fff;font-size:10px;font-weight:700;
          min-width:17px;height:17px;border-radius:9px;padding:0 4px;
          align-items:center;justify-content:center;"></span>
        <div id="thMsgDrop" style="display:none;position:absolute;top:40px;right:-10px;
          width:300px;background:#fff;border-radius:14px;
          box-shadow:0 8px 30px rgba(0,0,0,.15);z-index:2000;border:1px solid #eee;overflow:hidden;">
          <div style="padding:12px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #eee;color:#051923;">Messages</div>
          <div id="thMsgList" style="max-height:280px;overflow-y:auto;"></div>
          <a href="/html/chat.html" style="display:block;text-align:center;padding:11px;color:#0077B8;font-size:13px;font-weight:600;border-top:1px solid #eee;text-decoration:none;">See All Messages →</a>
        </div>
      </div>
      <div class="th-profile-wrap">
        <div class="th-avatar" id="thAvatar">${user.name.charAt(0).toUpperCase()}</div>
        <div class="th-prof-drop">
          <span class="th-drop-name">${user.name}</span>
          <a href="${dashUrl}">Dashboard</a>
          ${extraHtml}
          <a href="#" class="th-logout" onclick="Auth.logout();return false;">Logout</a>
        </div>
      </div>
    `;

    thLoadAvatar(user);
    thPollNotif();  setInterval(thPollNotif, 20000);
    thPollMsg();    setInterval(thPollMsg,   20000);
    document.addEventListener('click', () => {
      const dd = document.getElementById('thMsgDrop');
      if (dd) dd.style.display = 'none';
    });
  }

  // ── Avatar ────────────────────────────────────────────────────────
  async function thLoadAvatar(user) {
    try {
      const ep  = user.role === 'freelancer' ? '/api/profiles/freelancer' : '/api/profiles/client';
      const res = await fetch(ep, { headers: { Authorization: 'Bearer ' + Auth.token() } });
      const p   = await res.json();
      if (p?.avatar) {
        const el = document.getElementById('thAvatar');
        if (el) el.innerHTML = `<img src="${p.avatar}">`;
      }
    } catch (_) {}
  }

  // ── Bell poll ─────────────────────────────────────────────────────
  async function thPollNotif() {
    try {
      const res  = await fetch('/api/notifications/unread-count', { headers: { Authorization: 'Bearer ' + Auth.token() } });
      const data = await res.json();
      const el   = document.getElementById('thNotifBadge');
      if (!el) return;
      if (data.count > 0) { el.textContent = data.count > 9 ? '9+' : data.count; el.style.display = 'flex'; }
      else el.style.display = 'none';
    } catch (_) {}
  }

  // ── Messages poll ─────────────────────────────────────────────────
  async function thPollMsg() {
    try {
      const res   = await fetch('/api/chat/unread', { headers: { Authorization: 'Bearer ' + Auth.token() } });
      const data  = await res.json();
      const badge = document.getElementById('thMsgBadge');
      if (!badge) return;
      if (data.count > 0) { badge.textContent = data.count > 99 ? '99+' : data.count; badge.style.display = 'flex'; }
      else badge.style.display = 'none';
    } catch (_) {}
  }

  // ── Messages dropdown ─────────────────────────────────────────────
  window.thToggleMsg = function (e) {
    e.stopPropagation();
    const dd = document.getElementById('thMsgDrop');
    if (!dd) return;
    if (dd.style.display === 'block') { dd.style.display = 'none'; return; }
    thLoadMsgDrop();
    dd.style.display = 'block';
  };

  async function thLoadMsgDrop() {
    const list = document.getElementById('thMsgList');
    if (!list) return;
    list.innerHTML = '<p style="padding:14px;text-align:center;color:#9ab;font-size:13px;">Loading…</p>';
    try {
      const hdr = { Authorization: 'Bearer ' + Auth.token() };
      const [r1, r2] = await Promise.all([
        fetch('/api/chat/conversations', { headers: hdr }),
        fetch('/api/chat/direct',        { headers: hdr })
      ]);
      const [pc, dc] = await Promise.all([r1.json(), r2.json()]);
      const me = Auth.user();
      const all = [
        ...pc.map(c => ({ id: c.id, type: 'proposal', name: me.role === 'client' ? c.freelancer_name : c.client_name, last: c.last_message, unread: c.unread_count || 0 })),
        ...dc.map(c => ({ id: c.id, type: 'direct',   name: c.other_name,   last: c.last_message, unread: c.unread_count || 0 }))
      ].sort((a, b) => b.unread - a.unread).slice(0, 6);

      if (!all.length) {
        list.innerHTML = '<p style="padding:14px;text-align:center;color:#9ab;font-size:13px;">No messages yet.</p>';
        return;
      }
      list.innerHTML = all.map(c => `
        <a href="/html/chat.html?type=${c.type}&id=${c.id}"
           style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid #f0f4f8;text-decoration:none;color:inherit;background:${c.unread > 0 ? '#f0f8ff' : '#fff'};">
          <div style="width:36px;height:36px;border-radius:50%;background:#0077B8;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0;">${(c.name||'U').charAt(0).toUpperCase()}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:#051923;">${c.name||'User'}</div>
            <div style="font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.last||'No messages yet'}</div>
          </div>
          ${c.unread > 0 ? `<span style="background:#22c55e;color:#fff;font-size:10px;font-weight:700;min-width:18px;height:18px;border-radius:9px;padding:0 5px;display:flex;align-items:center;justify-content:center;">${c.unread}</span>` : ''}
        </a>`).join('');
      // Update badge
      const total = all.reduce((s, c) => s + c.unread, 0);
      const badge = document.getElementById('thMsgBadge');
      if (badge) {
        if (total > 0) { badge.textContent = total > 99 ? '99+' : total; badge.style.display = 'flex'; }
        else badge.style.display = 'none';
      }
    } catch (_) {
      if (list) list.innerHTML = '<p style="padding:14px;text-align:center;color:#e00;font-size:13px;">Failed to load</p>';
    }
  }

  // ── Profile popup modal ───────────────────────────────────────────
  const profileModal = document.createElement('div');
  profileModal.id = 'thProfileModal';
  profileModal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;align-items:center;justify-content:center;';
  profileModal.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:92%;max-width:500px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative;">
      <button onclick="document.getElementById('thProfileModal').style.display='none'"
        style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:24px;cursor:pointer;color:#888;z-index:1;line-height:1;">×</button>
      <div id="thProfContent" style="padding:28px 28px 24px;">Loading…</div>
    </div>`;
  profileModal.addEventListener('click', e => { if (e.target === profileModal) profileModal.style.display = 'none'; });
  if (document.body) {
    document.body.appendChild(profileModal);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(profileModal));
  }

  window.showUserProfile = async function (userId) {
    profileModal.style.display = 'flex';
    document.getElementById('thProfContent').innerHTML = '<div style="text-align:center;padding:40px;color:#9ab;">Loading profile…</div>';
    try {
      const res = await fetch('/api/users/' + userId + '/profile');
      const p   = await res.json();
      if (p.error) {
        document.getElementById('thProfContent').innerHTML = `<p style="color:#e00;text-align:center;">${p.error}</p>`;
        return;
      }
      const avatarHtml = p.avatar
        ? `<img src="${p.avatar}" style="width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid #e0f0ff;">`
        : `<div style="width:84px;height:84px;border-radius:50%;background:#0077B8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;">${(p.name||'U').charAt(0).toUpperCase()}</div>`;

      const stars = p.avg_rating ? Math.round(p.avg_rating) : 0;
      const starsHtml = stars > 0
        ? `<div style="margin-top:8px;font-size:15px;color:#f59e0b;">${'★'.repeat(stars)}${'☆'.repeat(5-stars)} <span style="font-size:12px;color:#777;">${Number(p.avg_rating).toFixed(1)} (${p.review_count||0} reviews)</span></div>`
        : '';

      let html = `
        <div style="text-align:center;margin-bottom:22px;">
          ${avatarHtml}
          <h2 style="margin:12px 0 4px;color:#051923;font-size:20px;">${p.display_name||p.name}</h2>
          <p style="color:#6b7280;font-size:13px;margin:0;">${p.title||(p.role==='client'?'Client':'Freelancer')}</p>
          ${starsHtml}
        </div>`;

      if (p.role === 'freelancer') {
        let skills = [];
        try { skills = JSON.parse(p.skills||'[]'); } catch(_) { skills = (p.skills||'').split(',').map(s=>s.trim()).filter(Boolean); }
        let langs = [];
        try { langs = JSON.parse(p.languages||'[]'); } catch(_) { langs = (p.languages||'').split(',').map(s=>s.trim()).filter(Boolean); }

        html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          ${p.category    ? `<div style="background:#f0f8ff;border-radius:10px;padding:11px;text-align:center;"><div style="font-size:10px;color:#6b7280;margin-bottom:3px;">CATEGORY</div><div style="font-weight:600;color:#0077B8;font-size:13px;">${p.category}</div></div>` : ''}
          ${p.hourly_rate ? `<div style="background:#f0fff4;border-radius:10px;padding:11px;text-align:center;"><div style="font-size:10px;color:#6b7280;margin-bottom:3px;">HOURLY RATE</div><div style="font-weight:700;color:#22c55e;font-size:16px;">$${p.hourly_rate}/hr</div></div>` : ''}
          ${p.projects_done > 0 ? `<div style="background:#f8f4ff;border-radius:10px;padding:11px;text-align:center;"><div style="font-size:10px;color:#6b7280;margin-bottom:3px;">PROJECTS DONE</div><div style="font-weight:700;color:#7c3aed;font-size:18px;">${p.projects_done}</div></div>` : ''}
          ${p.avg_price   ? `<div style="background:#fff8f0;border-radius:10px;padding:11px;text-align:center;"><div style="font-size:10px;color:#6b7280;margin-bottom:3px;">AVG PROJECT</div><div style="font-weight:700;color:#f97316;font-size:16px;">$${p.avg_price}</div></div>` : ''}
        </div>`;

        if (p.bio) html += `<p style="color:#374151;font-size:14px;line-height:1.65;margin-bottom:14px;">${p.bio}</p>`;
        if (skills.length) html += `<div style="margin-bottom:12px;"><div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:6px;letter-spacing:.5px;">SKILLS</div><div style="display:flex;flex-wrap:wrap;gap:6px;">${skills.map(s=>`<span style="background:#e0f0ff;color:#0077B8;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;">${s}</span>`).join('')}</div></div>`;
        if (p.city||p.country) html += `<div style="font-size:13px;color:#6b7280;margin-bottom:6px;">📍 ${[p.city,p.country].filter(Boolean).join(', ')}</div>`;
        if (langs.length) html += `<div style="font-size:13px;color:#6b7280;margin-bottom:14px;">🌐 ${langs.join(', ')}</div>`;
      } else {
        html += `<div style="display:grid;grid-template-columns:1fr;gap:10px;margin-bottom:16px;">
          <div style="background:#f0f8ff;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;color:#6b7280;margin-bottom:3px;">TOTAL POSTS</div>
            <div style="font-weight:700;color:#0077B8;font-size:24px;">${p.total_posts||0}</div>
          </div>
        </div>`;
        if (p.description) html += `<p style="color:#374151;font-size:14px;line-height:1.65;">${p.description}</p>`;
      }

      // Message button
      if (typeof Auth !== 'undefined' && Auth.isLoggedIn() && Auth.user().id !== Number(userId)) {
        html += `<div style="margin-top:20px;text-align:center;">
          <button onclick="thStartDM(${userId})"
            style="padding:11px 32px;background:#0077B8;color:#fff;border:none;border-radius:25px;font-weight:700;cursor:pointer;font-size:14px;">
            💬 Send Message
          </button>
        </div>`;
      }
      document.getElementById('thProfContent').innerHTML = html;
    } catch (_) {
      document.getElementById('thProfContent').innerHTML = '<p style="color:#e00;text-align:center;padding:20px;">Failed to load profile.</p>';
    }
  };

  window.thStartDM = async function (userId) {
    try {
      const res  = await fetch('/api/chat/direct/with/' + userId, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + Auth.token(), 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.id) window.location.href = '/html/chat.html?type=direct&id=' + data.id;
    } catch (_) { alert('Failed to start conversation'); }
  };

  // ── Run init ──────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
