/* ============================================================
   scent-finder.js
   PURPOSE : AI-style Scent Finder quiz — matches answers to
             products using a transparent scoring algorithm.

   NOTE: This v1 uses rule-based scoring against existing product
   attributes (gender, scent, mood) — fast, free, fully client-side.
   A v2 could swap this for a real LLM call (e.g. via an API route
   on a backend) for natural-language input and richer reasoning,
   using the same PRODUCTS data as context.
   ============================================================ */

/* ── QUIZ DEFINITION ── */
const QUIZ_QUESTIONS = [
  {
    id: 'gender',
    title: 'Who are we finding a scent for?',
    sub: 'This helps us narrow down the right collection.',
    full: true,
    options: [
      { value: 'Men',    icon: '🧑', label: 'A Man',        desc: 'Masculine fragrances' },
      { value: 'Women',  icon: '👩', label: 'A Woman',      desc: 'Feminine fragrances' },
      { value: 'Unisex', icon: '🧑‍🤝‍🧑', label: 'Doesn\'t Matter', desc: 'Open to anything' },
    ],
  },
  {
    id: 'mood',
    title: 'What\'s the occasion?',
    sub: 'Pick the moment you\'re dressing this scent for.',
    options: [
      { value: 'Office',     icon: '💼', label: 'Office / Daily Wear' },
      { value: 'Date Night', icon: '🌹', label: 'Date Night' },
      { value: 'Casual',     icon: '☀️', label: 'Casual Outings' },
      { value: 'Evening',    icon: '✨', label: 'Evening / Night Out' },
      { value: 'Luxury',     icon: '👑', label: 'Something Luxurious' },
      { value: 'Fresh',      icon: '🌊', label: 'Light & Refreshing' },
    ],
  },
  {
    id: 'scent',
    title: 'What kind of scent pulls you in?',
    sub: 'Think about smells you naturally gravitate toward.',
    options: [
      { value: 'Fresh',    icon: '🍋', label: 'Fresh & Citrusy',  desc: 'Clean, crisp, energizing' },
      { value: 'Floral',   icon: '🌸', label: 'Floral & Soft',    desc: 'Romantic, delicate' },
      { value: 'Woody',    icon: '🌲', label: 'Woody & Earthy',   desc: 'Warm, grounded' },
      { value: 'Oriental', icon: '🔥', label: 'Rich & Spicy',     desc: 'Bold, sensual, deep' },
    ],
  },
  {
    id: 'intensity',
    title: 'How bold do you like to smell?',
    sub: 'This helps us gauge your ideal fragrance strength.',
    options: [
      { value: 'subtle',  icon: '🤍', label: 'Subtle',  desc: 'Noticed only up close' },
      { value: 'balanced',icon: '⚖️', label: 'Balanced',desc: 'Present but not loud' },
      { value: 'bold',    icon: '⚡', label: 'Bold',    desc: 'Makes a statement' },
    ],
  },
  {
    id: 'budget',
    title: 'What\'s your ideal price range?',
    sub: 'We\'ll prioritize matches within this range.',
    options: [
      { value: 'budget',  icon: '💵', label: 'Under KES 8,000' },
      { value: 'mid',     icon: '💰', label: 'KES 8,000 – 15,000' },
      { value: 'luxury',  icon: '💎', label: 'KES 15,000+' },
      { value: 'any',     icon: '✨', label: 'Price Doesn\'t Matter' },
    ],
  },
];

/* ── STATE ── */
let currentQuestion = 0;
let answers = {};

/* ── INIT ── */
function startQuiz() {
  currentQuestion = 0;
  answers = {};
  showScreen('quizScreen');
  renderQuestion();
}

/* ── SCREEN SWITCHING ── */
function showScreen(id) {
  document.querySelectorAll('.finder-screen').forEach(s => s.style.display = 'none');
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';

  /* Widen the container only for the results screen */
  const inner = document.getElementById('finderInner');
  if (inner) inner.classList.toggle('finder__inner--wide', id === 'resultsScreen');
}

/* ── RENDER CURRENT QUESTION ── */
function renderQuestion() {
  const q = QUIZ_QUESTIONS[currentQuestion];
  const total = QUIZ_QUESTIONS.length;

  /* Progress */
  const pct = Math.round(((currentQuestion) / total) * 100);
  setStyle('progressFill', 'width', `${pct}%`);
  setText('progressCurrent', `Question ${currentQuestion + 1} of ${total}`);
  setText('progressPct', `${pct}%`);

  /* Question text */
  setText('questionTitle', q.title);
  setText('questionSub', q.sub);

  /* Options */
  const grid = document.getElementById('optionsGrid');
  grid.className = q.full ? 'finder-options finder-options--full' : 'finder-options';

  grid.innerHTML = q.options.map(opt => {
    const isSelected = answers[q.id] === opt.value;
    return `
      <div class="finder-option${isSelected ? ' is-selected' : ''}"
           onclick="selectOption('${q.id}', '${opt.value}')"
           role="button" tabindex="0"
           aria-pressed="${isSelected}">
        <div class="finder-option__check" aria-hidden="true">✓</div>
        <span class="finder-option__icon" aria-hidden="true">${opt.icon}</span>
        <div>
          <div class="finder-option__label">${opt.label}</div>
          ${opt.desc ? `<div class="finder-option__desc">${opt.desc}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  /* Nav buttons */
  const backBtn = document.getElementById('navBack');
  const nextBtn = document.getElementById('navNext');
  backBtn.disabled = currentQuestion === 0;
  nextBtn.disabled = !answers[q.id];
  nextBtn.textContent = currentQuestion === total - 1 ? 'See My Matches →' : 'Next →';
}

/* ── SELECT OPTION ── */
function selectOption(questionId, value) {
  answers[questionId] = value;
  renderQuestion();
}

/* ── NAVIGATION ── */
function goNext() {
  const q = QUIZ_QUESTIONS[currentQuestion];
  if (!answers[q.id]) return;

  if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    runMatching();
  }
}

function goBack() {
  if (currentQuestion === 0) return;
  currentQuestion--;
  renderQuestion();
}

/* ── RUN MATCHING (simulated AI processing + scoring) ── */
function runMatching() {
  showScreen('loadingScreen');

  /* Simulated AI "thinking" delay for perceived intelligence */
  setTimeout(() => {
    const matches = scoreProducts(answers);
    renderResults(matches);
    showScreen('resultsScreen');
  }, 1600);
}

/* ── SCORING ALGORITHM ── */
function scoreProducts(answers) {
  const scored = PRODUCTS.map(p => {
    let score = 0;
    const reasons = [];

    /* Gender — strong weight, unisex always partially matches */
    if (answers.gender === 'Unisex') {
      score += 10;
    } else if (p.gender === answers.gender) {
      score += 25;
      reasons.push(`crafted for ${answers.gender.toLowerCase()}`);
    } else if (p.gender === 'Unisex') {
      score += 15;
      reasons.push('a versatile unisex scent');
    }

    /* Mood — strong weight */
    if (p.mood === answers.mood) {
      score += 30;
      reasons.push(`perfect for ${answers.mood.toLowerCase()}`);
    }

    /* Scent family — strong weight */
    if (p.scent === answers.scent) {
      score += 30;
      reasons.push(`a ${answers.scent.toLowerCase()} fragrance you'll love`);
    }

    /* Intensity — inferred from scent family + mood as a proxy */
    const intensityMap = {
      subtle:   ['Fresh', 'Floral'],
      balanced: ['Floral', 'Woody'],
      bold:     ['Oriental', 'Woody'],
    };
    if (intensityMap[answers.intensity]?.includes(p.scent)) {
      score += 10;
    }

    /* Budget */
    const budgetRanges = {
      budget: [0, 8000],
      mid:    [8000, 15000],
      luxury: [15000, Infinity],
      any:    [0, Infinity],
    };
    const [min, max] = budgetRanges[answers.budget] || [0, Infinity];
    if (p.price >= min && p.price <= max) {
      score += 15;
      if (answers.budget !== 'any') reasons.push('fits your budget perfectly');
    }

    /* Bestseller/Luxury badge bonus — slight nudge for quality signals */
    if (p.badge === 'Bestseller') score += 5;

    return { product: p, score, reasons };
  });

  /* Sort by score, take top 3 */
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/* ── RENDER RESULTS ── */
function renderResults(matches) {
  const grid = document.getElementById('matchGrid');
  const maxScore = matches[0]?.score || 1;

  grid.innerHTML = matches.map((m, i) => {
    const p = m.product;
    const matchPct = Math.min(99, Math.round((m.score / (maxScore + 20)) * 100) + (i === 0 ? 10 : 0));
    const why = m.reasons.length
      ? `A great match because it's ${m.reasons.slice(0, 2).join(' and ')}.`
      : `A solid pick based on your preferences.`;
    const inCart = Cart.hasItem(p.id);

    return `
      <article class="match-card${i === 0 ? ' match-card--top' : ''}" style="animation-delay:${i * 0.15}s">
        <div class="match-card__badges">
          <span class="match-card__rank">#${i + 1} Match</span>
          <span class="match-card__match">${matchPct}% Match</span>
        </div>
        <div class="match-card__img" aria-hidden="true">${p.emoji}</div>
        <div class="match-card__body">
          <div class="match-card__brand">${p.brand}</div>
          <div class="match-card__name">${p.name}</div>
          <p class="match-card__why">${why}</p>
          <div class="match-card__price">From <strong>${Cart.formatPrice(p.price)}</strong></div>
          <div class="match-card__actions">
            <button class="btn btn--outline" onclick="window.location.href='product.html?id=${p.id}'">
              View
            </button>
            <button class="btn btn--primary" id="match-btn-${p.id}"
                    onclick="addMatchToCart(${p.id})">
              ${inCart ? '✓ Added' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </article>`;
  }).join('');
}

/* ── ADD TO CART FROM RESULTS ── */
function addMatchToCart(id) {
  const product = Cart.add(id);
  if (!product) return;
  const btn = document.getElementById(`match-btn-${id}`);
  if (btn) btn.textContent = '✓ Added';
  Toast.show(`${product.name} added to cart`);
}

/* ── RETAKE QUIZ ── */
function retakeQuiz() {
  startQuiz();
}

/* ── HELPERS ── */
function setText(id, text)  { const el = document.getElementById(id); if (el) el.textContent = text; }
function setStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; }

/* ── INIT ── */
showScreen('introScreen');