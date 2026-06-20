/* ============================================================
   product.js
   PURPOSE : Product detail page — render product, size selector,
             qty control, add to cart, tabs, related products
   DEPENDS : products.js, cart.js, global.js
   USED BY : product.html
   ============================================================ */

/* ── STATE ── */
let currentProduct = null;
let selectedSize   = null;
let qty            = 1;
let wishlist       = [];

/* ── SCENT NOTE VISUALS ── */
const SCENT_VISUALS = {
  'Cedar':          { icon: '🌲', type: 'Base' },
  'Citrus':         { icon: '🍋', type: 'Top' },
  'Vetiver':        { icon: '🌾', type: 'Base' },
  'Rose':           { icon: '🌹', type: 'Heart' },
  'Peony':          { icon: '🌸', type: 'Heart' },
  'Musk':           { icon: '🤍', type: 'Base' },
  'Black Truffle':  { icon: '🖤', type: 'Heart' },
  'Orchid':         { icon: '💜', type: 'Heart' },
  'Patchouli':      { icon: '🍂', type: 'Base' },
  'Mint':           { icon: '🌿', type: 'Top' },
  'Vanilla':        { icon: '🤎', type: 'Base' },
  'Tonka Bean':     { icon: '🫘', type: 'Base' },
  'Iris':           { icon: '💙', type: 'Heart' },
  'Praline':        { icon: '🍯', type: 'Base' },
  'Pineapple':      { icon: '🍍', type: 'Top' },
  'Birch':          { icon: '🪵', type: 'Heart' },
  'Oakmoss':        { icon: '🌿', type: 'Base' },
  'Coffee':         { icon: '☕', type: 'Heart' },
  'Bergamot':       { icon: '🟡', type: 'Top' },
  'Sandalwood':     { icon: '🪵', type: 'Base' },
  'Jasmine':        { icon: '🌼', type: 'Heart' },
  'Amber':          { icon: '🟠', type: 'Base' },
  'Lavender':       { icon: '💜', type: 'Heart' },
  'Leather':        { icon: '🟤', type: 'Base' },
  'Saffron':        { icon: '🌻', type: 'Heart' },
  'Oud':            { icon: '🔴', type: 'Base' },
  'Sea Salt':       { icon: '🌊', type: 'Top' },
  'Cardamom':       { icon: '🫚', type: 'Top' },
  'Rum':            { icon: '🥃', type: 'Heart' },
  'Tobacco':        { icon: '🍂', type: 'Base' },
};

/* ── INIT: read product ID from URL ── */
function initProduct() {
  const params = new URLSearchParams(window.location.search);
  const id     = parseInt(params.get('id'));

  if (!id) {
    showError('No product specified.');
    return;
  }

  currentProduct = getProductById(id);

  if (!currentProduct) {
    showError('Product not found.');
    return;
  }

  selectedSize = currentProduct.sizes[0];

  renderProduct();
  renderRelated();
  updateCartButtonState();
}

/* ── RENDER PRODUCT ── */
function renderProduct() {
  const p = currentProduct;

  /* Page title & meta */
  document.title = `${p.name} by ${p.brand} | Qton Perfumes`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content',
    `Buy ${p.name} by ${p.brand} at Qton Perfumes. ${p.description} Available in ${p.sizes.join(', ')}. Delivered across Kenya.`);

  /* Breadcrumb */
  const bcCurrent = document.getElementById('bcProduct');
  if (bcCurrent) bcCurrent.textContent = p.name;

  /* Gallery */
  const galleryEmoji = document.getElementById('galleryEmoji');
  if (galleryEmoji) galleryEmoji.textContent = p.emoji;

  const galleryBadge = document.getElementById('galleryBadge');
  if (galleryBadge) {
    galleryBadge.textContent = p.badge;
    galleryBadge.style.display = p.badge ? 'block' : 'none';
  }

  /* Thumbnails */
  const thumbsEl = document.getElementById('galleryThumbs');
  if (thumbsEl) {
    thumbsEl.innerHTML = [p.emoji, p.emoji, p.emoji].map((e, i) => `
      <div class="product-gallery__thumb ${i === 0 ? 'is-active' : ''}"
           onclick="selectThumb(this)" aria-label="View angle ${i + 1}">
        ${e}
      </div>`).join('');
  }

  /* Info */
  setEl('productBrand',   p.brand);
  setEl('productName',    p.name);
  setEl('productNotes',   p.notes);
  setEl('productPrice',   Cart.formatPrice(p.price));
  setEl('productGender',  p.gender);
  setEl('productScent',   p.scent);
  setEl('productMood',    p.mood);

  /* Sizes */
  renderSizes();

  /* Description tab */
  setEl('productDescription', p.description);

  /* Scent notes tab */
  renderScentNotes();

  /* Structured data */
  injectProductSchema();
}

/* ── RENDER SIZES ── */
function renderSizes() {
  const el = document.getElementById('sizeOpts');
  if (!el) return;
  el.innerHTML = currentProduct.sizes.map(s => `
    <button class="size-opt ${s === selectedSize ? 'is-active' : ''}"
            onclick="selectSize('${s}')"
            aria-label="Select size ${s}"
            aria-pressed="${s === selectedSize}">${s}</button>`).join('');
  updateSizeLabel();
}

function selectSize(size) {
  selectedSize = size;
  renderSizes();
}

function updateSizeLabel() {
  const el = document.getElementById('selectedSizeLabel');
  if (el) el.textContent = selectedSize;
}

/* ── QTY CONTROLS ── */
function changeQty(delta) {
  qty = Math.max(1, Math.min(10, qty + delta));
  const el = document.getElementById('qtyValue');
  if (el) el.value = qty;
}

function setQty(val) {
  qty = Math.max(1, Math.min(10, parseInt(val) || 1));
  const el = document.getElementById('qtyValue');
  if (el) el.value = qty;
}

/* ── ADD TO CART ── */
function addToCart() {
  if (!currentProduct) return;

  for (let i = 0; i < qty; i++) {
    Cart.add(currentProduct.id, selectedSize);
  }

  updateCartButtonState();
  Toast.show(`${currentProduct.name} (${selectedSize} × ${qty}) added to cart`);
}

function updateCartButtonState() {
  const btn = document.getElementById('addToCartBtn');
  if (!btn) return;
  const inCart = Cart.hasItem(currentProduct?.id);
  if (inCart) {
    btn.textContent = '✓ In Cart — Add More';
    btn.classList.add('is-added');
  } else {
    btn.textContent = 'Add to Cart';
    btn.classList.remove('is-added');
  }
}

/* ── WISHLIST ── */
function toggleWishlist() {
  if (!currentProduct) return;
  const id  = currentProduct.id;
  const btn = document.getElementById('wishlistBtn');
  if (wishlist.includes(id)) {
    wishlist = wishlist.filter(w => w !== id);
    if (btn) { btn.textContent = '♡'; btn.classList.remove('is-active'); }
    Toast.show('Removed from wishlist');
  } else {
    wishlist.push(id);
    if (btn) { btn.textContent = '♥'; btn.classList.add('is-active'); }
    Toast.show('Added to wishlist');
  }
}

/* ── GALLERY THUMB ── */
function selectThumb(el) {
  document.querySelectorAll('.product-gallery__thumb')
    .forEach(t => t.classList.remove('is-active'));
  el.classList.add('is-active');
}

/* ── TABS ── */
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('is-active');
  document.getElementById(tabId)?.classList.add('is-active');
}

/* ── SCENT NOTES ── */
function renderScentNotes() {
  const el = document.getElementById('scentNotesGrid');
  if (!el || !currentProduct) return;

  const noteNames = currentProduct.notes
    .split('·')
    .map(n => n.trim());

  el.innerHTML = noteNames.map(name => {
    const visual = SCENT_VISUALS[name] || { icon: '🌿', type: 'Note' };
    return `
      <div class="scent-note">
        <div class="scent-note__icon" aria-hidden="true">${visual.icon}</div>
        <div class="scent-note__type">${visual.type}</div>
        <div class="scent-note__name">${name}</div>
      </div>`;
  }).join('');
}

/* ── RELATED PRODUCTS ── */
function renderRelated() {
  const el = document.getElementById('relatedGrid');
  if (!el || !currentProduct) return;

  const related = PRODUCTS
    .filter(p => p.id !== currentProduct.id &&
      (p.scent === currentProduct.scent || p.gender === currentProduct.gender))
    .slice(0, 4);

  el.innerHTML = related.map((p, i) => {
    const inCart = Cart.hasItem(p.id);
    return `
      <article class="product-card" style="animation-delay:${i * 0.08}s"
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
            <button class="btn btn--ghost${inCart ? ' is-added' : ''}"
                    id="related-btn-${p.id}"
                    onclick="relatedAddToCart(event, ${p.id})"
                    aria-label="${inCart ? 'Added to cart' : 'Add to cart'}">
              ${inCart ? '✓ Added' : '+ Cart'}
            </button>
          </div>
        </div>
      </article>`;
  }).join('');
}

function relatedAddToCart(e, id) {
  e.stopPropagation();
  const product = Cart.add(id);
  if (!product) return;
  const btn = document.getElementById(`related-btn-${id}`);
  if (btn) { btn.textContent = '✓ Added'; btn.classList.add('is-added'); }
  Toast.show(`${product.name} added to cart`);
}

/* ── PRODUCT SCHEMA (injected dynamically) ── */
function injectProductSchema() {
  const p = currentProduct;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "brand": { "@type": "Brand", "name": p.brand },
    "description": p.description,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "KES",
      "price": p.price,
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "Qton Perfumes" }
    },
    "category": `${p.gender} Fragrance`,
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

/* ── HELPERS ── */
function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showError(msg) {
  const layout = document.getElementById('productLayout');
  if (layout) layout.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:80px 20px">
      <div style="font-size:3rem;margin-bottom:1rem">🔍</div>
      <h2 style="font-family:var(--font-serif);font-weight:300;margin-bottom:1rem">${msg}</h2>
      <a href="shop.html" class="btn btn--outline">Back to Shop</a>
    </div>`;
}

/* ── CART UPDATED ── */
document.addEventListener('cartUpdated', () => {
  updateCartButtonState();
  /* Refresh related buttons */
  PRODUCTS.forEach(p => {
    const btn = document.getElementById(`related-btn-${p.id}`);
    if (!btn) return;
    const inCart = Cart.hasItem(p.id);
    btn.textContent = inCart ? '✓ Added' : '+ Cart';
    btn.classList.toggle('is-added', inCart);
  });
});

/* ── INIT ── */
initProduct();