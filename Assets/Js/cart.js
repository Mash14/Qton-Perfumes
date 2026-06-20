/* ============================================================
   cart.js
   PURPOSE : Cart state management — add, remove, update, totals
   DEPENDS : products.js (must be loaded first)
   USED BY : All pages
   ============================================================ */

const Cart = (() => {

  const STORAGE_KEY = 'qton_cart';

  let _items = _load(); // { key, id, name, brand, price, emoji, size, qty }

  /* ── PERSISTENCE ── */
  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Cart: failed to load from storage', err);
      return [];
    }
  }

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_items));
    } catch (err) {
      console.error('Cart: failed to save to storage', err);
    }
  }

  /* ── ADD ── */
  function add(productId, size = null) {
    const product = getProductById(productId);
    if (!product) return;

    const selectedSize = size || product.sizes[0];
    const key = `${productId}-${selectedSize}`;
    const existing = _items.find(i => i.key === key);

    if (existing) {
      existing.qty++;
    } else {
      _items.push({
        key,
        id:    product.id,
        name:  product.name,
        brand: product.brand,
        price: product.price,
        emoji: product.emoji,
        size:  selectedSize,
        qty:   1,
      });
    }

    _sync();
    return product;
  }

  /* ── REMOVE ── */
  function remove(key) {
    _items = _items.filter(i => i.key !== key);
    _sync();
  }

  /* ── UPDATE QTY ── */
  function updateQty(key, qty) {
    const item = _items.find(i => i.key === key);
    if (!item) return;
    if (qty <= 0) { remove(key); return; }
    item.qty = qty;
    _sync();
  }

  /* ── CLEAR ── */
  function clear() {
    _items = [];
    _sync();
  }

  /* ── GETTERS ── */
  function getItems()  { return [..._items]; }
  function getCount()  { return _items.reduce((sum, i) => sum + i.qty, 0); }
  function getTotal()  { return _items.reduce((sum, i) => sum + (i.price * i.qty), 0); }
  function isEmpty()   { return _items.length === 0; }
  function hasItem(id) { return _items.some(i => i.id === id); }

  /* ── SYNC UI ── */
  function _sync() {
    _save();
    /* Update all cart count badges across the page */
    document.querySelectorAll('#cartCount').forEach(el => {
      el.textContent = getCount();
    });
    /* Dispatch event so pages can react */
    document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: _items, count: getCount(), total: getTotal() } }));
  }

  /* ── FORMAT HELPERS ── */
  function formatPrice(amount) {
    return `KES ${amount.toLocaleString()}`;
  }

  return { add, remove, updateQty, clear, getItems, getCount, getTotal, isEmpty, hasItem, formatPrice };

})();

/* Ensure badge reflects persisted cart immediately on every page load */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#cartCount').forEach(el => {
    el.textContent = Cart.getCount();
  });
});