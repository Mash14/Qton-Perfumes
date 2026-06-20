/* ============================================================
   cart-page.js
   PURPOSE : Cart page rendering — item list, qty controls,
             remove, summary panel, order via WhatsApp / form
   DEPENDS : products.js, cart.js, global.js
   USED BY : cart.html
   ============================================================ */

/* ── RENDER CART ── */
function renderCart() {
  const items     = Cart.getItems();
  const container = document.getElementById('cartContainer');
  if (!container) return;

  if (items.length === 0) {
    renderEmptyCart();
    return;
  }

  renderCartItems(items);
  renderSummary(items);
}

/* ── EMPTY CART ── */
function renderEmptyCart() {
  const container = document.getElementById('cartContainer');
  container.innerHTML = `
    <div class="cart-empty">
      <div class="cart-empty__icon" aria-hidden="true">🛍️</div>
      <h2 class="cart-empty__title">Your cart is empty</h2>
      <p class="cart-empty__sub">
        Discover our collection and find a fragrance that speaks to you.
      </p>
      <a href="shop.html" class="btn btn--primary">Browse Fragrances</a>
    </div>`;

  /* Hide summary panel */
  const summary = document.getElementById('summaryPanel');
  if (summary) summary.style.display = 'none';
}

/* ── CART ITEMS ── */
function renderCartItems(items) {
  const container = document.getElementById('cartContainer');

  container.innerHTML = `
    <!-- Column headers (desktop) -->
    <div class="cart-items__header" aria-hidden="true">
      <div class="cart-items__col">Product</div>
      <div class="cart-items__col cart-items__col--center">Price</div>
      <div class="cart-items__col cart-items__col--center">Quantity</div>
      <div class="cart-items__col cart-items__col--right">Total</div>
    </div>

    <!-- Items -->
    <div id="itemsList">
      ${items.map((item, i) => renderItemRow(item, i)).join('')}
    </div>

    <!-- Cart actions -->
    <div class="cart-actions">
      <a href="shop.html" class="cart-actions__continue" aria-label="Continue shopping">
        ← Continue Shopping
      </a>
      <button class="cart-actions__clear" onclick="confirmClearCart()"
              aria-label="Clear all items from cart">
        Clear Cart
      </button>
    </div>`;
}

function renderItemRow(item, index) {
  const lineTotal = item.price * item.qty;
  return `
    <article class="cart-item" style="animation-delay:${index * 0.06}s"
             aria-label="${item.name} by ${item.brand}">

      <!-- Product info -->
      <div class="cart-item__product">
        <div class="cart-item__img" aria-hidden="true">${item.emoji}</div>
        <div>
          <div class="cart-item__brand">${item.brand}</div>
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__size">Size: ${item.size}</div>
        </div>
      </div>

      <!-- Unit price -->
      <div class="cart-item__price" aria-label="Price per item">
        <strong>${Cart.formatPrice(item.price)}</strong>
      </div>

      <!-- Qty stepper -->
      <div class="cart-item__qty" role="group" aria-label="Quantity for ${item.name}">
        <button class="cart-qty-btn"
                onclick="updateItemQty('${item.key}', ${item.qty - 1})"
                aria-label="Decrease quantity">−</button>
        <input  class="cart-qty-val"
                type="number" value="${item.qty}" min="1" max="10"
                onchange="updateItemQty('${item.key}', parseInt(this.value))"
                aria-label="Quantity"/>
        <button class="cart-qty-btn"
                onclick="updateItemQty('${item.key}', ${item.qty + 1})"
                aria-label="Increase quantity">+</button>
      </div>

      <!-- Total + remove -->
      <div class="cart-item__actions">
        <div class="cart-item__total" aria-label="Line total">
          ${Cart.formatPrice(lineTotal)}
        </div>
        <button class="cart-item__remove"
                onclick="removeItem('${item.key}')"
                aria-label="Remove ${item.name} from cart">
          Remove
        </button>
      </div>

    </article>`;
}

/* ── ORDER SUMMARY ── */
function renderSummary(items) {
  const panel = document.getElementById('summaryPanel');
  if (!panel) return;
  panel.style.display = 'block';

  const subtotal = Cart.getTotal();
  const count    = Cart.getCount();

  document.getElementById('summarySubtotal').textContent = Cart.formatPrice(subtotal);
  document.getElementById('summaryCount').textContent    =
    `${count} item${count !== 1 ? 's' : ''}`;
  document.getElementById('summaryTotal').textContent    = Cart.formatPrice(subtotal);
}

/* ── QTY UPDATE ── */
function updateItemQty(key, newQty) {
  Cart.updateQty(key, Math.max(0, Math.min(10, newQty || 0)));
  renderCart();
}

/* ── REMOVE ITEM ── */
function removeItem(key) {
  Cart.remove(key);
  renderCart();
  Toast.show('Item removed from cart');
}

/* ── CLEAR CART ── */
function confirmClearCart() {
  if (Cart.isEmpty()) return;
  /* Simple inline confirm — replace with a modal in production */
  if (window.confirm('Clear all items from your cart?')) {
    Cart.clear();
    renderCart();
    Toast.show('Cart cleared');
  }
}

/* ── PROCEED TO ORDER ── */
function proceedToOrder() {
  if (Cart.isEmpty()) {
    Toast.show('Your cart is empty');
    return;
  }
  window.location.href = 'order.html';
}

/* ── ORDER VIA WHATSAPP ── */
function orderViaWhatsApp() {
  if (Cart.isEmpty()) {
    Toast.show('Your cart is empty');
    return;
  }

  const items   = Cart.getItems();
  const total   = Cart.getTotal();
  const phone   = '254700000000';

  let message = 'Hello Qton Perfumes! I would like to place an order:\n\n';

  items.forEach((item, i) => {
    message += `${i + 1}. ${item.brand} – ${item.name}\n`;
    message += `   Size: ${item.size} | Qty: ${item.qty} | ${Cart.formatPrice(item.price * item.qty)}\n`;
  });

  message += `\nOrder Total: ${Cart.formatPrice(total)}`;
  message += '\n\nPlease confirm availability and delivery charges. Thank you!';

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
}

/* ── CART UPDATED EVENT ── */
document.addEventListener('cartUpdated', () => {
  renderCart();
});

/* ── INIT ── */
renderCart();