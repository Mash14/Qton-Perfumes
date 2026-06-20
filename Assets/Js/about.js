/* ============================================================
   about.js
   PURPOSE : About page logic — FAQ accordion, stats counter
   DEPENDS : global.js
   USED BY : about.html
   ============================================================ */

/* ── FAQ ACCORDION ── */
function toggleFaq(el) {
  const item   = el.closest('.faq-item');
  const answer = item.querySelector('.faq-item__answer');
  const inner  = item.querySelector('.faq-item__answer-inner');
  const isOpen = item.classList.contains('is-open');

  /* Close all other FAQ items (accordion behaviour) */
  document.querySelectorAll('.faq-item.is-open').forEach(openItem => {
    if (openItem !== item) {
      openItem.classList.remove('is-open');
      openItem.querySelector('.faq-item__answer').style.maxHeight = '0px';
      openItem.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
    }
  });

  if (isOpen) {
    item.classList.remove('is-open');
    answer.style.maxHeight = '0px';
    el.setAttribute('aria-expanded', 'false');
  } else {
    item.classList.add('is-open');
    answer.style.maxHeight = inner.scrollHeight + 'px';
    el.setAttribute('aria-expanded', 'true');
  }
}

/* ── STATS COUNT-UP ANIMATION ── */
function animateStats() {
  const stats = document.querySelectorAll('.stat__number[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  stats.forEach(stat => observer.observe(stat));
}

function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1500;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const value    = Math.floor(eased * target);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }

  requestAnimationFrame(tick);
}

/* ── INIT ── */
animateStats();