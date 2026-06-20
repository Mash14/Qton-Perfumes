/* ============================================================
   admin.js
   PURPOSE : Admin dashboard — login, product CRUD, order
             management, dashboard stats
   DEPENDS : products.js, cart.js (for formatPrice)
   USED BY : admin.html

   NOTE: This is a front-end-only admin panel. Product edits and
   order data are stored in localStorage. A real production
   version would connect to a backend/database so changes persist
   for all users and survive across browsers/devices.
   ============================================================ */

const ADMIN_PASSWORD = 'qton2025'; // ⚠️ Change this before going live
const PRODUCTS_KEY    = 'qton_admin_products';
const SESSION_KEY      = 'qton_admin_session';

/* ── STATE ── */
let adminProducts  = [];
let editingProductId = null;
let currentView    = 'dashboard';

/* ============================================================
   LOGIN
   ============================================================ */
function initLogin() {
  const isLoggedIn = sessionStorage.getItem(SESSION_KEY) === 'true';
  if (isLoggedIn) {
    showAdminShell();
  } else {
    showLoginScreen();
  }
}

function attemptLogin(e) {
  e.preventDefault();
  const input = document.getElementById('adminPassword');
  const error = document.getElementById('loginError');

  if (input.value === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    showAdminShell();
  } else {
    error.classList.add('is-visible');
    input.style.borderColor = '#e05555';
    input.value = '';
    input.focus();
  }
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  showLoginScreen();
}

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminShell').style.display  = 'none';
}

function showAdminShell() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminShell').style.display  = 'grid';
  initDashboard();
}

/* ============================================================
   PRODUCTS DATA (localStorage overlay on top of products.js)
   ============================================================ */
function loadAdminProducts() {
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    adminProducts = stored ? JSON.parse(stored) : [...PRODUCTS];
  } catch (err) {
    console.error('Admin: failed to load products', err);
    adminProducts = [...PRODUCTS];
  }
}

function saveAdminProducts() {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(adminProducts));
  } catch (err) {
    console.error('Admin: failed to save products', err);
  }
}

/* ============================================================
   ORDERS DATA
   ============================================================ */
function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem('qton_orders') || '[]');
  } catch (err) {
    console.error('Admin: failed to load orders', err);
    return [];
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem('qton_orders', JSON.stringify(orders));
  } catch (err) {
    console.error('Admin: failed to save orders', err);
  }
}

function updateOrderStatus(orderId, newStatus) {
  const orders = loadOrders();
  const order  = orders.find(o => o.id === orderId);
  if (!order) return;
  order.status = newStatus;
  saveOrders(orders);
  renderOrders();
  renderDashboardStats();
  Toast.show(`Order ${orderId} marked as ${newStatus}`);
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function switchView(view) {
  currentView = view;

  document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('is-active'));
  document.getElementById(`view-${view}`)?.classList.add('is-active');

  document.querySelectorAll('.admin-nav__item').forEach(item => {
    item.classList.toggle('is-active', item.dataset.view === view);
  });

  /* Close mobile sidebar after navigating */
  closeMobileSidebar();

  /* Render the relevant view */
  if (view === 'dashboard') renderDashboardStats();
  if (view === 'products')  renderProductsTable();
  if (view === 'orders')    renderOrders();
}

function toggleMobileSidebar() {
  document.getElementById('adminSidebar').classList.toggle('is-open');
  document.getElementById('adminOverlay').classList.toggle('is-open');
}

function closeMobileSidebar() {
  document.getElementById('adminSidebar').classList.remove('is-open');
  document.getElementById('adminOverlay').classList.remove('is-open');
}

/* ============================================================
   DASHBOARD OVERVIEW
   ============================================================ */
function initDashboard() {
  loadAdminProducts();
  renderDashboardStats();
  renderProductsTable();
  renderOrders();
}

function renderDashboardStats() {
  const orders   = loadOrders();
  const pending  = orders.filter(o => !o.status || o.status === 'New').length;
  const revenue  = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const lowStock = adminProducts.filter(p => (p.stock ?? 10) <= 3).length;

  setText('statTotalOrders', orders.length);
  setText('statPending',     pending);
  setText('statRevenue',     Cart.formatPrice(revenue));
  setText('statProducts',    adminProducts.length);

  const badge = document.getElementById('ordersBadge');
  if (badge) {
    if (pending > 0) {
      badge.textContent = pending;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  /* Recent orders preview on dashboard */
  const recentList = document.getElementById('recentOrdersList');
  if (recentList) {
    const recent = [...orders].reverse().slice(0, 5);
    recentList.innerHTML = recent.length
      ? recent.map(o => renderOrderRow(o)).join('')
      : `<tr><td colspan="6"><div class="admin-empty">
           <div class="admin-empty__icon">📭</div>
           No orders yet.
         </div></td></tr>`;
  }
}

/* ============================================================
   PRODUCTS — TABLE
   ============================================================ */
function renderProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  const search = document.getElementById('productSearch')?.value.toLowerCase() || '';
  const genderFilter = document.getElementById('productGenderFilter')?.value || '';

  let list = [...adminProducts];
  if (search) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.brand.toLowerCase().includes(search));
  }
  if (genderFilter) list = list.filter(p => p.gender === genderFilter);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="admin-empty">
      <div class="admin-empty__icon">🔍</div>
      No products found.
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>
        <div class="table-product">
          <div class="table-product__img">${p.emoji}</div>
          <div>
            <div class="table-product__name">${p.name}</div>
            <div class="table-product__brand">${p.brand}</div>
          </div>
        </div>
      </td>
      <td>${p.gender}</td>
      <td>${p.scent}</td>
      <td>${Cart.formatPrice(p.price)}</td>
      <td>${p.badge ? `<span class="pill pill--confirmed">${p.badge}</span>` : '—'}</td>
      <td>
        <div class="table-actions">
          <button class="table-btn" onclick="openProductModal(${p.id})" aria-label="Edit ${p.name}">✏️</button>
          <button class="table-btn table-btn--danger" onclick="deleteProduct(${p.id})" aria-label="Delete ${p.name}">🗑️</button>
        </div>
      </td>
    </tr>`).join('');
}

function filterProducts() { renderProductsTable(); }

/* ============================================================
   PRODUCTS — ADD / EDIT MODAL
   ============================================================ */
function openProductModal(id = null) {
  editingProductId = id;
  const modal = document.getElementById('productModal');
  const title = document.getElementById('productModalTitle');

  if (id) {
    const p = adminProducts.find(x => x.id === id);
    if (!p) return;
    title.textContent = 'Edit Product';
    setVal('pf-brand', p.brand);
    setVal('pf-name', p.name);
    setVal('pf-notes', p.notes);
    setVal('pf-price', p.price);
    setVal('pf-gender', p.gender);
    setVal('pf-scent', p.scent);
    setVal('pf-mood', p.mood);
    setVal('pf-badge', p.badge);
    setVal('pf-emoji', p.emoji);
    setVal('pf-description', p.description || '');
  } else {
    title.textContent = 'Add New Product';
    ['pf-brand','pf-name','pf-notes','pf-price','pf-badge','pf-description']
      .forEach(id => setVal(id, ''));
    setVal('pf-gender', 'Men');
    setVal('pf-scent', 'Fresh');
    setVal('pf-mood', 'Casual');
    setVal('pf-emoji', '🌸');
  }

  modal.classList.add('is-open');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('is-open');
  editingProductId = null;
}

function saveProduct(e) {
  e.preventDefault();

  const brand = getVal('pf-brand').trim();
  const name  = getVal('pf-name').trim();
  const price = parseInt(getVal('pf-price'));

  if (!brand || !name || isNaN(price)) {
    Toast.show('Please fill in brand, name and a valid price');
    return;
  }

  const productData = {
    brand,
    name,
    notes:       getVal('pf-notes').trim(),
    price,
    gender:      getVal('pf-gender'),
    scent:       getVal('pf-scent'),
    mood:        getVal('pf-mood'),
    badge:       getVal('pf-badge').trim(),
    emoji:       getVal('pf-emoji').trim() || '🌸',
    description: getVal('pf-description').trim(),
    sizes:       ['30ml', '50ml', '100ml'],
  };

  if (editingProductId) {
    const idx = adminProducts.findIndex(p => p.id === editingProductId);
    if (idx > -1) adminProducts[idx] = { ...adminProducts[idx], ...productData };
    Toast.show('Product updated');
  } else {
    const newId = Math.max(0, ...adminProducts.map(p => p.id)) + 1;
    adminProducts.push({ id: newId, ...productData });
    Toast.show('Product added');
  }

  saveAdminProducts();
  closeProductModal();
  renderProductsTable();
  renderDashboardStats();
}

function deleteProduct(id) {
  const product = adminProducts.find(p => p.id === id);
  if (!product) return;
  if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

  adminProducts = adminProducts.filter(p => p.id !== id);
  saveAdminProducts();
  renderProductsTable();
  renderDashboardStats();
  Toast.show('Product deleted');
}

/* ── AI DESCRIPTION GENERATOR (placeholder hook) ──
   In production this would call an AI API with the brand + name
   to generate description, notes, and tags automatically. */
function generateAIDescription() {
  const brand = getVal('pf-brand').trim();
  const name  = getVal('pf-name').trim();

  if (!brand || !name) {
    Toast.show('Enter a brand and name first');
    return;
  }

  const btn = document.getElementById('aiGenerateBtn');
  btn.disabled = true;
  btn.textContent = '✨ Generating…';

  /* Simulated AI delay — replace with real API call */
  setTimeout(() => {
    setVal('pf-description',
      `${name} by ${brand} is a captivating fragrance that blends elegance with character — perfect for those who want to make a lasting impression.`);
    btn.disabled = false;
    btn.textContent = '✨ Generate with AI';
    Toast.show('Description generated');
  }, 1200);
}

/* ============================================================
   ORDERS
   ============================================================ */
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const orders = [...loadOrders()].reverse();
  const statusFilter = document.getElementById('orderStatusFilter')?.value || '';

  let list = orders;
  if (statusFilter) list = list.filter(o => (o.status || 'New') === statusFilter);

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="admin-empty">
      <div class="admin-empty__icon">📭</div>
      No orders found.
    </div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => renderOrderRow(o)).join('');
}

function renderOrderRow(order) {
  const status = order.status || 'New';
  const pillClass = {
    'New': 'pill--new', 'Called': 'pill--called',
    'Confirmed': 'pill--confirmed', 'Delivered': 'pill--delivered',
    'Cancelled': 'pill--cancelled',
  }[status] || 'pill--new';

  const date = new Date(order.date).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return `
    <tr>
      <td><strong>${order.id}</strong></td>
      <td>${order.name}<br/><span style="color:var(--muted);font-size:var(--text-xs)">${order.phone}</span></td>
      <td>${order.items?.length || 0} item${order.items?.length !== 1 ? 's' : ''}</td>
      <td>${Cart.formatPrice(order.total || 0)}</td>
      <td>${date}</td>
      <td>
        <select class="status-select" onchange="updateOrderStatus('${order.id}', this.value)">
          ${['New','Called','Confirmed','Delivered','Cancelled'].map(s =>
            `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>`;
}

function filterOrders() { renderOrders(); }

/* ============================================================
   HELPERS
   ============================================================ */
function setText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function setVal(id, val)   { const el = document.getElementById(id); if (el) el.value = val; }
function getVal(id)        { return document.getElementById(id)?.value || ''; }

/* ── INIT ── */
initLogin();