/* ============================================================
   shop.js
   PURPOSE : Shop page logic — search, filters, sort, pagination,
             URL param support, add to cart
   DEPENDS : products.js, cart.js, global.js
   USED BY : shop.html
   ============================================================ */

const PAGE_SIZE = 20;

/* ── STATE ── */
let state = {
  search:   '',
  gender:   [],
  scent:    [],
  mood:     [],
  brand:    [],
  priceMin: null,
  priceMax: null,
  sort:     'default',
  page:     1,
};

/* ── READ URL PARAMS (from footer links e.g. shop.html?gender=Men) ── */
function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('gender')) state.gender = [params.get('gender')];
  if (params.get('scent'))  state.scent  = [params.get('scent')];
  if (params.get('mood'))   state.mood   = [params.get('mood')];
  if (params.get('badge'))  {
    /* badge param maps to a visual filter — handled via search */
    state.search = params.get('badge');
  }
}

/* ── BUILD SIDEBAR FILTER OPTIONS ── */
function buildFilterOpts(containerId, items, key) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(v => `
    <label class="filter-opt">
      <input type="checkbox" value="${v}"
             ${state[key].includes(v) ? 'checked' : ''}
             onchange="toggleFilter('${key}','${v}',this.checked)"
             aria-label="Filter by ${v}"/>
      <span>${v}</span>
      <span class="opt-count">${PRODUCTS.filter(p => p[key] === v).length}</span>
    </label>`).join('');
}

function buildSidebar() {
  buildFilterOpts('opts-gender', ALL_GENDERS, 'gender');
  buildFilterOpts('opts-scent',  ALL_SCENTS,  'scent');
  buildFilterOpts('opts-mood',   ALL_MOODS,   'mood');
  buildFilterOpts('opts-brand',  ALL_BRANDS,  'brand');
}

/* ── FILTER LOGIC ── */
function getFiltered() {
  let list = [...PRODUCTS];

  const q = state.search.toLowerCase().trim();
  if (q) list = list.filter(p =>
    p.name.toLowerCase().includes(q)  ||
    p.brand.toLowerCase().includes(q) ||
    p.notes.toLowerCase().includes(q) ||
    p.badge.toLowerCase().includes(q)
  );

  if (state.gender.length) list = list.filter(p => state.gender.includes(p.gender));
  if (state.scent.length)  list = list.filter(p => state.scent.includes(p.scent));
  if (state.mood.length)   list = list.filter(p => state.mood.includes(p.mood));
  if (state.brand.length)  list = list.filter(p => state.brand.includes(p.brand));

  if (state.priceMin !== null) list = list.filter(p => p.price >= state.priceMin);
  if (state.priceMax !== null) list = list.filter(p => p.price <= state.priceMax);

  switch (state.sort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'az':         list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'za':         list.sort((a, b) => b.name.localeCompare(a.name)); break;
  }

  return list;
}

/* ── RENDER ── */
function render() {
  const filtered    = getFiltered();
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;

  const start = (state.page - 1) * PAGE_SIZE;
  const end   = Math.min(start + PAGE_SIZE, filtered.length);
  const paged = filtered.slice(start, end);

  /* Count */
  const countEl = document.getElementById('shopCount');
  if (countEl) {
    countEl.innerHTML = filtered.length
      ? `Showing <strong>${start + 1}–${end}</strong> of <strong>${filtered.length}</strong> fragrances`
      : '<strong>0</strong> fragrances found';
  }

  renderChips();
  renderPagination(totalPages);
  renderGrid(paged);
}

/* ── RENDER GRID ── */
function renderGrid(paged) {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;

  if (!paged.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <div class="empty-state__title">No fragrances found</div>
        <p class="empty-state__sub">Try adjusting your filters or search term.</p>
        <button class="btn btn--outline" onclick="resetAll()">Clear All Filters</button>
      </div>`;
    return;
  }

  grid.innerHTML = paged.map((p, i) => {
    const inCart = Cart.hasItem(p.id);
    return `
      <article class="product-card" style="animation-delay:${i * 0.04}s"
               onclick="window.location.href='product.html?id=${p.id}'"
               aria-label="${p.name} by ${p.brand}">
        <div class="product-card__img">
          ${p.badge ? `<div class="product-card__badge">${p.badge}</div>` : ''}
          <div class="product-card__emoji" aria-hidden="true">${p.emoji}</div>
        </div>
        <div class="product-card__body">
          <div class="product-card__brand">${p.brand}</div>
          <div class="product-card__name">${p.name}</div>
          <div class="product-card__notes">${p.notes}</div>
          <div class="product-card__footer">
            <div class="product-card__price">
              <strong>${Cart.formatPrice(p.price)}</strong>
            </div>
            <button
              class="btn btn--ghost${inCart ? ' is-added' : ''}"
              id="shop-btn-${p.id}"
              onclick="shopAddToCart(event, ${p.id})"
              aria-label="${inCart ? 'Added to cart' : 'Add to cart'}">
              ${inCart ? '✓ Added' : '+ Cart'}
            </button>
          </div>
        </div>
      </article>`;
  }).join('');
}

/* ── RENDER PAGINATION ── */
function renderPagination(totalPages) {
  const wrap = document.getElementById('pagination');
  if (!wrap) return;
  if (totalPages <= 1) { wrap.innerHTML = ''; return; }

  const cur = state.page;
  let html = `
    <button class="pg-btn" onclick="goPage(${cur - 1})"
            ${cur === 1 ? 'disabled' : ''}
            aria-label="Previous page">← Prev</button>`;

  getPageNumbers(cur, totalPages).forEach(p => {
    html += p === '…'
      ? `<span class="pg-ellipsis" aria-hidden="true">…</span>`
      : `<button class="pg-btn${p === cur ? ' is-active' : ''}"
                 onclick="goPage(${p})"
                 aria-label="Page ${p}"
                 aria-current="${p === cur ? 'page' : 'false'}">${p}</button>`;
  });

  html += `
    <button class="pg-btn" onclick="goPage(${cur + 1})"
            ${cur === totalPages ? 'disabled' : ''}
            aria-label="Next page">Next →</button>`;

  wrap.innerHTML = html;
}

function getPageNumbers(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 4)         return [1, 2, 3, 4, 5, '…', total];
  if (cur >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
  return [1, '…', cur - 1, cur, cur + 1, '…', total];
}

function goPage(n) {
  state.page = n;
  render();
  const layout = document.querySelector('.shop-layout');
  if (layout) window.scrollTo({ top: layout.offsetTop - 90, behavior: 'smooth' });
}

/* ── RENDER ACTIVE FILTER CHIPS ── */
function renderChips() {
  const wrap = document.getElementById('activeFilters');
  if (!wrap) return;

  const chips = [];
  ['gender', 'scent', 'mood', 'brand'].forEach(key =>
    state[key].forEach(v => chips.push({ label: v, key, val: v }))
  );
  if (state.priceMin !== null || state.priceMax !== null) {
    chips.push({
      label: `KES ${(state.priceMin ?? 0).toLocaleString()} – ${state.priceMax ? state.priceMax.toLocaleString() : '∞'}`,
      key: 'price', val: ''
    });
  }
  if (state.search) chips.push({ label: `"${state.search}"`, key: 'search', val: '' });

  wrap.innerHTML = chips.map(c => `
    <div class="filter-chip" role="status">
      ${c.label}
      <button class="filter-chip__remove"
              onclick="removeChip('${c.key}','${c.val}')"
              aria-label="Remove ${c.label} filter">✕</button>
    </div>`).join('');
}

function removeChip(key, val) {
  if (key === 'search') {
    state.search = '';
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    toggleSearchClear(false);
  } else if (key === 'price') {
    state.priceMin = null;
    state.priceMax = null;
    const mn = document.getElementById('priceMin');
    const mx = document.getElementById('priceMax');
    if (mn) mn.value = '';
    if (mx) mx.value = '';
  } else {
    state[key] = state[key].filter(v => v !== val);
    syncCheckboxes();
  }
  state.page = 1;
  render();
}

/* ── FILTER ACTIONS ── */
function toggleFilter(key, val, checked) {
  if (checked) {
    if (!state[key].includes(val)) state[key].push(val);
  } else {
    state[key] = state[key].filter(v => v !== val);
  }
  state.page = 1;
  render();
}

function syncCheckboxes() {
  ['gender', 'scent', 'mood', 'brand'].forEach(key => {
    document.querySelectorAll(`#opts-${key} input`).forEach(cb => {
      cb.checked = state[key].includes(cb.value);
    });
  });
}

function toggleGroup(id) {
  document.getElementById(id)?.classList.toggle('is-collapsed');
}

function applyPrice() {
  const mn = parseInt(document.getElementById('priceMin')?.value);
  const mx = parseInt(document.getElementById('priceMax')?.value);
  state.priceMin = isNaN(mn) ? null : mn;
  state.priceMax = isNaN(mx) ? null : mx;
  state.page = 1;
  render();
}

function applySort() {
  state.sort = document.getElementById('sortSelect')?.value || 'default';
  state.page = 1;
  render();
}

/* ── SEARCH ── */
function handleSearch(val) {
  state.search = val;
  state.page   = 1;
  toggleSearchClear(val.length > 0);
  render();
}

function clearSearch() {
  state.search = '';
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = '';
  toggleSearchClear(false);
  state.page = 1;
  render();
}

function toggleSearchClear(show) {
  document.getElementById('searchClear')?.classList.toggle('is-visible', show);
  document.getElementById('searchIcon')?.classList.toggle('is-hidden', show);
}

/* ── RESET ALL ── */
function resetAll() {
  state = {
    search: '', gender: [], scent: [], mood: [], brand: [],
    priceMin: null, priceMax: null, sort: 'default', page: 1
  };
  const inp = document.getElementById('searchInput');
  const mn  = document.getElementById('priceMin');
  const mx  = document.getElementById('priceMax');
  const sel = document.getElementById('sortSelect');
  if (inp) inp.value = '';
  if (mn)  mn.value  = '';
  if (mx)  mx.value  = '';
  if (sel) sel.value = 'default';
  toggleSearchClear(false);
  syncCheckboxes();
  render();
}

/* ── ADD TO CART ── */
function shopAddToCart(e, id) {
  e.stopPropagation();
  const product = Cart.add(id);
  if (!product) return;

  const btn = document.getElementById(`shop-btn-${id}`);
  if (btn) {
    btn.textContent = '✓ Added';
    btn.classList.add('is-added');
    btn.setAttribute('aria-label', 'Added to cart');
  }

  Toast.show(`${product.name} added to cart`);
}

/* ── MOBILE DRAWER ── */
function openDrawer() {
  const sidebar  = document.getElementById('sidebar');
  const content  = document.getElementById('drawerContent');
  const drawer   = document.getElementById('drawer');
  const overlay  = document.getElementById('overlay');
  if (!sidebar || !content || !drawer || !overlay) return;
  content.innerHTML = sidebar.innerHTML;
  drawer.classList.add('is-open');
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('drawer')?.classList.remove('is-open');
  document.getElementById('overlay')?.classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ── CART UPDATED: refresh button states ── */
document.addEventListener('cartUpdated', () => {
  PRODUCTS.forEach(p => {
    const btn = document.getElementById(`shop-btn-${p.id}`);
    if (!btn) return;
    const inCart = Cart.hasItem(p.id);
    btn.textContent = inCart ? '✓ Added' : '+ Cart';
    btn.classList.toggle('is-added', inCart);
  });
});

/* ── INIT ── */
readURLParams();
buildSidebar();
render();

/* Pre-fill search input if search state was set via URL */
if (state.search) {
  const inp = document.getElementById('searchInput');
  if (inp) inp.value = state.search;
  toggleSearchClear(true);
}