// assets/js/theme.js — dark mode via CSS filter inversion.
// Flips everything once on body, then re-inverts media so they look normal.
(function () {
  try {
    if (localStorage.getItem('th-theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      // Prevent old body.dark-mode system from conflicting with filter inversion
      localStorage.setItem('darkMode', '0');
    }
  } catch (_) {}

  if (document.getElementById('th-theme-styles')) return;
  const style = document.createElement('style');
  style.id = 'th-theme-styles';
  style.textContent = `
    html[data-theme="dark"] { color-scheme: dark; background:#0f1720; }

    /* Invert the whole page */
    html[data-theme="dark"] body {
      filter: invert(1) hue-rotate(180deg);
      background-color: #ffffff !important;
      min-height: 100vh;
    }

    /* Neutralize old body.dark-mode class when filter dark mode is active */
    html[data-theme="dark"] body.dark-mode {
      background: #ffffff !important;
      color: inherit !important;
    }
    html[data-theme="dark"] body.dark-mode nav,
    html[data-theme="dark"] body.dark-mode .hero-wrapper,
    html[data-theme="dark"] body.dark-mode .task-card,
    html[data-theme="dark"] body.dark-mode .feature-card,
    html[data-theme="dark"] body.dark-mode .features-section,
    html[data-theme="dark"] body.dark-mode .testi-card,
    html[data-theme="dark"] body.dark-mode .category,
    html[data-theme="dark"] body.dark-mode .nav-dropdown,
    html[data-theme="dark"] body.dark-mode .search-input-wrapper {
      background: revert !important;
      border-color: revert !important;
    }
    html[data-theme="dark"] body.dark-mode h1,
    html[data-theme="dark"] body.dark-mode h2,
    html[data-theme="dark"] body.dark-mode h3,
    html[data-theme="dark"] body.dark-mode p,
    html[data-theme="dark"] body.dark-mode .hero-content h1,
    html[data-theme="dark"] body.dark-mode .hero-content p,
    html[data-theme="dark"] body.dark-mode .feature-card h3,
    html[data-theme="dark"] body.dark-mode .feature-card p,
    html[data-theme="dark"] body.dark-mode .task-card h3,
    html[data-theme="dark"] body.dark-mode .task-desc,
    html[data-theme="dark"] body.dark-mode .task-category,
    html[data-theme="dark"] body.dark-mode .task-price,
    html[data-theme="dark"] body.dark-mode .task-skills span,
    html[data-theme="dark"] body.dark-mode .testi-text,
    html[data-theme="dark"] body.dark-mode .category h3,
    html[data-theme="dark"] body.dark-mode .nav-dropdown a,
    html[data-theme="dark"] body.dark-mode #nav-user-name,
    html[data-theme="dark"] body.dark-mode .section-title,
    html[data-theme="dark"] body.dark-mode .trending-header h2 {
      color: revert !important;
    }

    /* Logo: prevent double-inversion so it appears light (single-inverted) on dark navbar */
    html[data-theme="dark"] .th-logo img,
    html[data-theme="dark"] .logo img { filter: none !important; }

    /* Hero heading: force black so it inverts to visible white */
    html[data-theme="dark"] .hero-content h1,
    html[data-theme="dark"] .hero-content h1 span,
    html[data-theme="dark"] .hero-content p { color: #000 !important; }

    /* Feature cards text: force black so it inverts to visible white */
    html[data-theme="dark"] .feature-card h3,
    html[data-theme="dark"] .feature-card p,
    html[data-theme="dark"] .features-title,
    html[data-theme="dark"] .features-subtitle { color: #000 !important; }

    /* Filter bar selects: force dark text so it inverts to visible white */
    html[data-theme="dark"] .filter-container select,
    html[data-theme="dark"] .filter-container option { color: #000 !important; background: #fff !important; }

    /* Re-invert media so images/icons keep original colors */
    html[data-theme="dark"] img,
    html[data-theme="dark"] picture,
    html[data-theme="dark"] video,
    html[data-theme="dark"] iframe,
    html[data-theme="dark"] embed,
    html[data-theme="dark"] canvas,
    html[data-theme="dark"] [style*="background-image"],
    html[data-theme="dark"] [style*="background:url"],
    html[data-theme="dark"] [style*="background: url"] {
      filter: invert(1) hue-rotate(180deg);
    }

    /* Footer was already dark in light mode — keep it dark (re-invert) */
    html[data-theme="dark"] .footer { filter: invert(1) hue-rotate(180deg); }
    html[data-theme="dark"] .footer img,
    html[data-theme="dark"] .footer picture,
    html[data-theme="dark"] .footer video { filter: none; }

    /* Toggle switch visual indicator */
    html[data-theme="dark"] .th-prof-drop .th-theme-toggle .th-switch::after {
      transform: translateX(16px);
    }

    /* Fix: elements with color:#fff become black after body inversion — set to #000 so inversion makes them white */
    html[data-theme="dark"] .chat-avatar,
    html[data-theme="dark"] .conv-avatar,
    html[data-theme="dark"] .conv-unread,
    html[data-theme="dark"] .msg-avatar,
    html[data-theme="dark"] .msg-group.mine .msg-bubble,
    html[data-theme="dark"] .send-btn,
    html[data-theme="dark"] .nav-avatar,
    html[data-theme="dark"] .notif-badge,
    html[data-theme="dark"] .proposal-avatar,
    html[data-theme="dark"] .btn-accept,
    html[data-theme="dark"] .btn-chat,
    html[data-theme="dark"] .th-avatar,
    html[data-theme="dark"] .th-btn-signup,
    html[data-theme="dark"] #thNotifBadge,
    html[data-theme="dark"] #thMsgBadge,
    html[data-theme="dark"] .search-btn,
    html[data-theme="dark"] .action-btn.blue,
    html[data-theme="dark"] .btn.primary,
    html[data-theme="dark"] .share-btn,
    html[data-theme="dark"] .apply-btn,
    html[data-theme="dark"] .view-more,
    html[data-theme="dark"] .signup,
    html[data-theme="dark"] .verified { color: #000 !important; }
  `;
  (document.head || document.documentElement).appendChild(style);

  // After DOM loads: remove conflicting body.dark-mode and override old toggleDarkMode
  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      document.body.classList.remove('dark-mode');
    }

    // Override old page-level toggleDarkMode so old nav buttons use the new system
    window.toggleDarkMode = function () {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('th-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('th-theme', 'dark');
        localStorage.setItem('darkMode', '0');
        document.body.classList.remove('dark-mode');
      }
      // Update old dark-mode button label if present
      const btn = document.getElementById('dark-mode-btn');
      if (btn) {
        const nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
        btn.innerHTML = nowDark
          ? '<i class="fa-solid fa-sun"></i> Light Mode'
          : '<i class="fa-solid fa-moon"></i> Dark Mode';
      }
    };
  });
})();
