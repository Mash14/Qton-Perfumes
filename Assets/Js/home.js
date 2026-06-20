/* ============================================================
   home.js
   PURPOSE : Home page logic — featured products, gender toggle,
             mood filter, add to cart
   DEPENDS : products.js, cart.js, global.js
   USED BY : index.html
   ============================================================ */

/* ── STATE ── */
let activeGender = 'All';
let activeMood   = null;

/* ── GENDER TOGGLE ── */
function setGender(el, val) {
  document.querySelectorAll('.gender-toggle__btn')
    .forEach(b => b.classList.remove('is-active'));
  el.classList.add('is-active');
  activeGender = val;
  renderFeatured();
}

/* ── MOOD FILTER ── */
function setMood(el) {
  document.querySelectorAll('.mood-card')
    .forEach(c => c.classList.remove('is-active'));
  el.classList.add('is-active');
  const name = el.querySelector('.mood-card__name').textContent.trim();
  activeMood = (name === 'All') ? null : name;
  renderFeatured();
}

/* ── RENDER FEATURED PRODUCTS ── */
function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;

  /* Filter from shared PRODUCTS data */
  let list = getProducts({ limit: 50 });
  if (activeGender !== 'All') list = list.filter(p => p.gender === activeGender);
  if (activeMood)             list = list.filter(p => p.mood   === activeMood);

  /* Show max 8 on home page */
  list = list.slice(0, 8);

  if (!list.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">
        <div style="font-size:2rem;margin-bottom:1rem">🔍</div>
        <p>No fragrances match this filter.
          <a href="#" style="color:var(--gold)" onclick="resetHomeFilters(event)">Clear filters</a>
        </p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => {
    const inCart = Cart.hasItem(p.id);
    return `
      <div class="product-card" style="animation-delay:${i * 0.06}s"
           onclick="window.location.href='product.html?id=${p.id}'">
        <div class="product-card__img">
          ${p.badge ? `<div class="product-card__badge">${p.badge}</div>` : ''}
          <div class="product-card__emoji">${p.emoji}</div>
        </div>
        <div class="product-card__body">
          <div class="product-card__brand">${p.brand}</div>
          <div class="product-card__name">${p.name}</div>
          <div class="product-card__notes">${p.notes}</div>
          <div class="product-card__footer">
            <div class="product-card__price">
              From <strong>${Cart.formatPrice(p.price)}</strong>
            </div>
            <button
              class="btn btn--ghost${inCart ? ' is-added' : ''}"
              id="home-btn-${p.id}"
              onclick="homeAddToCart(event, ${p.id})">
              ${inCart ? '✓ Added' : '+ Cart'}
            </button>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ── ADD TO CART ── */
function homeAddToCart(e, id) {
  e.stopPropagation();
  const product = Cart.add(id);
  if (!product) return;

  const btn = document.getElementById(`home-btn-${id}`);
  if (btn) {
    btn.textContent = '✓ Added';
    btn.classList.add('is-added');
  }

  Toast.show(`${product.name} added to cart`);
}

/* ── RESET HOME FILTERS ── */
function resetHomeFilters(e) {
  if (e) e.preventDefault();
  activeGender = 'All';
  activeMood   = null;

  document.querySelectorAll('.gender-toggle__btn')
    .forEach((b, i) => b.classList.toggle('is-active', i === 0));

  document.querySelectorAll('.mood-card')
    .forEach(c => c.classList.remove('is-active'));

  const resetCard = document.getElementById('moodReset');
  if (resetCard) resetCard.classList.add('is-active');

  renderFeatured();
}

/* ── CART UPDATED: refresh button states ── */
document.addEventListener('cartUpdated', () => {
  PRODUCTS.forEach(p => {
    const btn = document.getElementById(`home-btn-${p.id}`);
    if (!btn) return;
    const inCart = Cart.hasItem(p.id);
    btn.textContent = inCart ? '✓ Added' : '+ Cart';
    btn.classList.toggle('is-added', inCart);
  });
});

/* ── INIT ── */
renderFeatured();
