/* ============================================================
   global.js
   PURPOSE : Shared UI behaviours present on every page —
             navbar, toast, WhatsApp, cart badge sync
   DEPENDS : cart.js (must be loaded first)
   USED BY : All pages
   ============================================================ */

/* ── NAVBAR ── */
(function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  /* Toggle open/close */
  hamburger.addEventListener('click', e => {
    e.stopPropagation();
    navLinks.classList.toggle('is-open');
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      navLinks.classList.remove('is-open');
    }
  });

  /* Close on scroll */
  window.addEventListener('scroll', () => {
    navLinks.classList.remove('is-open');
  }, { passive: true });

  /* Mark active nav link based on current page */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
})();

/* ── TOAST NOTIFICATION ── */
const Toast = (() => {
  let _timer;

  function show(message, duration = 3000) {
    const el      = document.getElementById('toast');
    const textEl  = document.getElementById('toastText');
    if (!el || !textEl) return;

    clearTimeout(_timer);
    textEl.textContent = message;
    el.classList.add('is-visible');
    _timer = setTimeout(() => el.classList.remove('is-visible'), duration);
  }

  return { show };
})();

/* ── CART BADGE SYNC ── */
(function initCartBadge() {
  function updateBadge() {
    document.querySelectorAll('#cartCount').forEach(el => {
      el.textContent = Cart.getCount();
    });
  }
  /* Update on cart change */
  document.addEventListener('cartUpdated', updateBadge);
  /* Update on page load */
  updateBadge();
})();

/* ── SMOOTH SCROLL for anchor links ── */
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });
})();

/* ── SCROLL REVEAL (lightweight) ── */
(function initScrollReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();
