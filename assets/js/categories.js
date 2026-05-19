/**
 * Shared logic for all category pages.
 * Each page sets window.PAGE_CONFIG before including this file:
 *   window.PAGE_CONFIG = { category: 'Design & Creative' }
 * For all-categories page, category is null (fetch everything).
 */

(function () {
  const API = 'http://localhost:3000/api';
  const PAGE_CATEGORY = (window.PAGE_CONFIG && window.PAGE_CONFIG.category) || null;
  const BATCH = 9; // cards shown per load-more

  let allCards = [];   // cached freelancers from API
  let filtered = [];   // after applying filters
  let shown    = 0;    // how many are currently visible

  // ── DOM refs ────────────────────────────────────────────────────────────────
  const grid         = document.getElementById('freelancer-grid');
  const loadMoreBtn  = document.getElementById('loadMoreBtn');
  const typeFilter   = document.getElementById('typeFilter');
  const priceFilter  = document.getElementById('priceFilter');
  const expFilter    = document.getElementById('expFilter');
  const drawer       = document.getElementById('drawer');
  const overlay      = document.getElementById('overlay');
  const closeDrawer  = document.getElementById('closeDrawer');
  const menuToggle   = document.getElementById('menuToggle');
  const navLinks     = document.getElementById('navLinks');

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function initials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function buildCardHTML(f) {
    const skillSpans = (f.skills || '').split(',').map(s => `<span>${s.trim()}</span>`).join('');
    const avatarHTML = f.image_url
      ? `<img src="${f.image_url}" class="avatar-img" alt="${f.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
         <div class="avatar-initials" style="display:none;width:100%;height:100%;border-radius:50%;background:#0090E0;color:#fff;align-items:center;justify-content:center;font-weight:700;font-size:22px;">${initials(f.name)}</div>`
      : `<div class="avatar-initials" style="width:100%;height:100%;border-radius:50%;background:#0090E0;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:22px;">${initials(f.name)}</div>`;

    return `
      <div class="up-card"
           data-name="${f.name}"
           data-price="${f.hourly_rate}"
           data-type="${f.sub_category}"
           data-exp="${f.experience_years}"
           data-img="${f.image_url || ''}"
           data-role="${f.role_text}">
        <div class="card-image-wrapper">
          ${avatarHTML}
          <div class="status-badge"></div>
        </div>
        <div class="card-content">
          <h3>${f.name}</h3>
          <p class="role-text">${f.role_text}</p>
          <div class="stats-row">
            <span class="price-tag">$${f.hourly_rate}/hr</span>
            <span class="rating-tag">⭐ ${f.rating}</span>
            <span class="exp-tag">${f.experience_years} yrs</span>
          </div>
          <div class="skills-tags">${skillSpans}</div>
          <button class="view-profile-btn">View Profile</button>
        </div>
      </div>`;
  }

  function renderCards() {
    if (!grid) return;
    shown = Math.min(BATCH, filtered.length);
    grid.innerHTML = filtered.length === 0
      ? '<div class="no-results"><h4>No results found</h4><p>Try changing your filters</p></div>'
      : filtered.slice(0, shown).map(buildCardHTML).join('');
    if (loadMoreBtn) loadMoreBtn.style.display = shown < filtered.length ? 'inline-block' : 'none';
    bindCardEvents();
  }

  function applyFilters() {
    const selType  = typeFilter  ? typeFilter.value  : 'all';
    const selPrice = priceFilter ? priceFilter.value : 'all';
    const selExp   = expFilter   ? expFilter.value   : 'all';

    filtered = allCards.filter(f => {
      if (selType  !== 'all' && f.sub_category !== selType) return false;
      if (selPrice !== 'all') {
        const [mn, mx] = selPrice.split('-').map(Number);
        if (f.hourly_rate < mn || f.hourly_rate > mx) return false;
      }
      if (selExp !== 'all') {
        if (selExp === '6-10') { if (f.experience_years < 6) return false; }
        else {
          const [mn, mx] = selExp.split('-').map(Number);
          if (f.experience_years < mn || f.experience_years > mx) return false;
        }
      }
      return true;
    });
    shown = 0;
    renderCards();
  }

  // ── Drawer ──────────────────────────────────────────────────────────────────
  function openDrawer(card) {
    if (!drawer) return;
    const name = card.dataset.name || '';
    const type = card.dataset.type || '';
    const img  = card.dataset.img  || '';

    document.getElementById('dName').textContent = name;
    document.getElementById('dType').textContent = type;
    const dImg = document.getElementById('dImg');
    if (dImg) {
      if (img) { dImg.src = img; dImg.style.display = 'block'; }
      else { dImg.style.display = 'none'; }
    }
    drawer.classList.add('open');
    if (overlay) overlay.style.display = 'block';
  }

  function doCloseDrawer() {
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
  }

  function bindCardEvents() {
    document.querySelectorAll('.up-card').forEach(card => {
      ['.avatar-img', '.avatar-initials', '.view-profile-btn'].forEach(sel => {
        const el = card.querySelector(sel);
        if (el) el.addEventListener('click', e => { e.stopPropagation(); openDrawer(card); });
      });
    });
  }

  // ── Load More ────────────────────────────────────────────────────────────────
  function loadMore() {
    const next = Math.min(shown + BATCH, filtered.length);
    for (let i = shown; i < next; i++) {
      const div = document.createElement('div');
      div.innerHTML = buildCardHTML(filtered[i]);
      grid.appendChild(div.firstElementChild);
    }
    shown = next;
    bindCardEvents();
    if (loadMoreBtn) loadMoreBtn.style.display = shown < filtered.length ? 'inline-block' : 'none';
  }

  // ── Sidebar filter links ─────────────────────────────────────────────────────
  function bindSidebarLinks() {
    document.querySelectorAll('.filter-link').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const val = this.dataset.type;
        if (val && typeFilter) {
          typeFilter.value = val;
          applyFilters();
          document.querySelectorAll('.filter-link').forEach(l => l.classList.remove('active'));
          this.classList.add('active');
        }
      });
    });
  }

  // ── Sidebar accordion ────────────────────────────────────────────────────────
  function bindSidebarAccordion() {
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.onclick = e => { e.stopPropagation(); btn.parentElement.classList.toggle('active'); };
    });
  }

  // ── Navbar toggle ────────────────────────────────────────────────────────────
  if (menuToggle && navLinks) {
    menuToggle.onclick = () => navLinks.classList.toggle('active');
  }

  // ── Event bindings ────────────────────────────────────────────────────────────
  if (closeDrawer) closeDrawer.onclick = doCloseDrawer;
  if (overlay)     overlay.onclick     = doCloseDrawer;
  if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);
  if (typeFilter)  typeFilter.addEventListener('change',  applyFilters);
  if (priceFilter) priceFilter.addEventListener('change', applyFilters);
  if (expFilter)   expFilter.addEventListener('change',   applyFilters);

  const applyBtn = document.getElementById('applyFilterBtn');
  if (applyBtn) applyBtn.addEventListener('click', applyFilters);

  bindSidebarLinks();
  bindSidebarAccordion();

  // ── Fetch & init ──────────────────────────────────────────────────────────────
  async function init() {
    if (!grid) return;
    grid.innerHTML = '<p style="padding:2rem;text-align:center;color:#888;">Loading...</p>';

    try {
      const params = PAGE_CATEGORY ? 'category=' + encodeURIComponent(PAGE_CATEGORY) + '&limit=200' : 'limit=200';
      const res  = await fetch(API + '/freelancers?' + params);
      allCards   = await res.json();
    } catch (e) {
      grid.innerHTML = '<p style="padding:2rem;text-align:center;color:#e00;">Failed to load. Is the server running?</p>';
      return;
    }

    // If URL hash contains a sub-category, pre-select filter
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && typeFilter) {
      const opt = Array.from(typeFilter.options).find(o => o.value === hash);
      if (opt) typeFilter.value = hash;
    }

    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();
