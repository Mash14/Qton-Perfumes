/* ============================================================
   order.js
   PURPOSE : Order/checkout page — form validation, order review,
             submission, confirmation screen
   DEPENDS : products.js, cart.js, global.js
   USED BY : order.html
   ============================================================ */

/* ── STATE ── */
let deliveryMethod = 'delivery'; // 'delivery' | 'pickup'

/* ── INIT ── */
function initOrderPage() {
  const items = Cart.getItems();

  if (items.length === 0) {
    showEmptyCartRedirect();
    return;
  }

  renderOrderReview(items);
}

/* ── EMPTY CART GUARD ── */
function showEmptyCartRedirect() {
  const layout = document.getElementById('orderLayout');
  if (!layout) return;
  layout.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:80px 20px">
      <div style="font-size:3rem;margin-bottom:1rem">🛍️</div>
      <h2 style="font-family:var(--font-serif);font-weight:300;margin-bottom:1rem">
        Your cart is empty
      </h2>
      <p style="color:var(--muted);margin-bottom:2rem">
        Add a few fragrances to your cart before checking out.
      </p>
      <a href="shop.html" class="btn btn--primary">Browse Fragrances</a>
    </div>`;
}

/* ── DELIVERY METHOD TOGGLE ── */
function setDeliveryMethod(method) {
  deliveryMethod = method;

  document.querySelectorAll('.delivery-option').forEach(el => {
    el.classList.toggle('is-active', el.dataset.method === method);
  });

  const locationFields = document.getElementById('locationFields');
  if (locationFields) {
    locationFields.classList.toggle('is-hidden', method === 'pickup');
  }

  /* Toggle required attribute on location fields */
  const locationInput = document.getElementById('locationInput');
  if (locationInput) {
    if (method === 'delivery') {
      locationInput.setAttribute('required', 'true');
    } else {
      locationInput.removeAttribute('required');
    }
  }

  updateReviewTotals();
}

/* ── RENDER ORDER REVIEW ── */
function renderOrderReview(items) {
  const list = document.getElementById('reviewItemsList');
  if (!list) return;

  list.innerHTML = items.map(item => `
    <div class="review-item">
      <div class="review-item__img" aria-hidden="true">${item.emoji}</div>
      <div class="review-item__info">
        <div class="review-item__name">${item.brand} – ${item.name}</div>
        <div class="review-item__meta">Size: ${item.size} &nbsp;×&nbsp; Qty: ${item.qty}</div>
      </div>
      <div class="review-item__price">
        ${Cart.formatPrice(item.price * item.qty)}
      </div>
    </div>`).join('');

  updateReviewTotals();
}

/* ── UPDATE TOTALS ── */
function updateReviewTotals() {
  const subtotal = Cart.getTotal();
  const count    = Cart.getCount();

  setText('reviewCount', `${count} item${count !== 1 ? 's' : ''}`);
  setText('reviewSubtotal', Cart.formatPrice(subtotal));

  const deliveryNote = deliveryMethod === 'pickup'
    ? 'Free (Pickup)'
    : 'Confirmed by phone';
  setText('reviewDelivery', deliveryNote);

  /* Total shown excludes delivery fee since it's confirmed by phone */
  setText('reviewTotal', Cart.formatPrice(subtotal));
}

/* ── FORM VALIDATION ── */
function validateForm() {
  let valid = true;
  const requiredFields = [
    { id: 'nameInput',  errorId: 'nameError' },
    { id: 'phoneInput', errorId: 'phoneError' },
  ];

  if (deliveryMethod === 'delivery') {
    requiredFields.push({ id: 'locationInput', errorId: 'locationError' });
  }

  requiredFields.forEach(({ id, errorId }) => {
    const input = document.getElementById(id);
    const error = document.getElementById(errorId);
    if (!input) return;

    const value = input.value.trim();
    const isInvalid = value === '';

    if (error) error.classList.toggle('is-visible', isInvalid);
    input.style.borderColor = isInvalid ? '#e05555' : '';

    if (isInvalid) valid = false;
  });

  /* Phone format check (basic Kenyan number validation) */
  const phoneInput = document.getElementById('phoneInput');
  const phoneError = document.getElementById('phoneError');
  if (phoneInput && phoneInput.value.trim() !== '') {
    const phoneRegex = /^(?:\+254|0)[17]\d{8}$/;
    const cleaned = phoneInput.value.trim().replace(/\s/g, '');
    if (!phoneRegex.test(cleaned)) {
      if (phoneError) {
        phoneError.textContent = 'Enter a valid Kenyan phone number (e.g. 0712345678)';
        phoneError.classList.add('is-visible');
      }
      phoneInput.style.borderColor = '#e05555';
      valid = false;
    }
  }

  return valid;
}

/* ── SUBMIT ORDER ── */
function submitOrder(e) {
  e.preventDefault();

  if (!validateForm()) {
    Toast.show('Please fill in all required fields correctly');
    return;
  }

  if (Cart.isEmpty()) {
    Toast.show('Your cart is empty');
    return;
  }

  const orderData = {
    id:        generateOrderId(),
    name:      document.getElementById('nameInput').value.trim(),
    phone:     document.getElementById('phoneInput').value.trim(),
    location:  deliveryMethod === 'delivery'
                 ? document.getElementById('locationInput').value.trim()
                 : 'Pickup — Nairobi CBD Store',
    method:    deliveryMethod,
    notes:     document.getElementById('notesInput')?.value.trim() || '',
    items:     Cart.getItems(),
    total:     Cart.getTotal(),
    date:      new Date().toISOString(),
  };

  /* In a real backend, this would POST to a server / admin dashboard.
     For now we simulate by storing locally and showing confirmation. */
  saveOrder(orderData);

  showConfirmation(orderData);
}

/* ── GENERATE ORDER ID ── */
function generateOrderId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `QTN-${Date.now().toString().slice(-6)}${rand}`;
}

/* ── SAVE ORDER (localStorage — placeholder for real backend) ── */
function saveOrder(orderData) {
  try {
    const existing = JSON.parse(localStorage.getItem('qton_orders') || '[]');
    existing.push(orderData);
    localStorage.setItem('qton_orders', JSON.stringify(existing));
  } catch (err) {
    console.error('Order: failed to save order', err);
  }
}

/* ── SHOW CONFIRMATION SCREEN ── */
function showConfirmation(orderData) {
  const layout = document.getElementById('orderLayout');
  const header = document.getElementById('orderHeader');
  if (header) header.style.display = 'none';
  if (!layout) return;

  const waMessage = buildWhatsAppMessage(orderData);
  const waUrl = `https://wa.me/254700000000?text=${encodeURIComponent(waMessage)}`;

  layout.innerHTML = `
    <div class="confirmation" style="grid-column:1/-1">
      <div class="confirmation__icon" aria-hidden="true">✅</div>
      <h1 class="confirmation__title">Order Received!</h1>
      <div class="confirmation__order-id">Order #${orderData.id}</div>
      <p class="confirmation__sub">
        Thank you, ${orderData.name.split(' ')[0]}! We've received your order
        for ${Cart.getCount()} item${Cart.getCount() !== 1 ? 's' : ''}
        totaling <strong style="color:var(--gold)">${Cart.formatPrice(orderData.total)}</strong>.
      </p>

      <div class="confirmation__steps">
        <div class="confirmation-step">
          <div class="confirmation-step__num">1</div>
          <div class="confirmation-step__text">
            Our team will call <strong>${orderData.phone}</strong> within
            the next few hours to confirm your order and delivery pricing.
          </div>
        </div>
        <div class="confirmation-step">
          <div class="confirmation-step__num">2</div>
          <div class="confirmation-step__text">
            ${orderData.method === 'delivery'
              ? `We'll confirm the total cost including delivery to <strong>${orderData.location}</strong>.`
              : `Visit our Nairobi CBD store to collect your order and pay in person.`}
          </div>
        </div>
        <div class="confirmation-step">
          <div class="confirmation-step__num">3</div>
          <div class="confirmation-step__text">
            Once confirmed, your fragrance${Cart.getCount() !== 1 ? 's' : ''} will be
            ${orderData.method === 'delivery' ? 'on its way to you' : 'ready for pickup'}.
          </div>
        </div>
      </div>

      <div class="confirmation__actions">
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn--primary">
          💬 Confirm via WhatsApp
        </a>
        <a href="shop.html" class="btn btn--outline">Continue Shopping</a>
      </div>
    </div>`;

  /* Clear cart now that order is placed */
  Cart.clear();
}

/* ── BUILD WHATSAPP CONFIRMATION MESSAGE ── */
function buildWhatsAppMessage(orderData) {
  let msg = `Hello Qton Perfumes! I just placed an order.\n\n`;
  msg += `Order #${orderData.id}\n`;
  msg += `Name: ${orderData.name}\n`;
  msg += `Phone: ${orderData.phone}\n`;
  msg += `${orderData.method === 'delivery' ? 'Delivery Location' : 'Method'}: ${orderData.location}\n\n`;

  orderData.items.forEach((item, i) => {
    msg += `${i + 1}. ${item.brand} – ${item.name} (${item.size}) × ${item.qty}\n`;
  });

  msg += `\nOrder Total: ${Cart.formatPrice(orderData.total)}`;
  msg += `\n\nPlease confirm availability and final delivery pricing. Thank you!`;

  return msg;
}

/* ── HELPER ── */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ── CART UPDATED ── */
document.addEventListener('cartUpdated', () => {
  if (!Cart.isEmpty()) {
    renderOrderReview(Cart.getItems());
  }
});

/* ── INIT ── */
initOrderPage();