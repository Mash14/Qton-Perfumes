# Qton Perfumes 🌸

A full front-end e-commerce experience for a fictional Nairobi-based fragrance store — built to showcase modern UI/UX design, a complete customer purchase journey, and an AI-powered product discovery feature.

**Live concept, not a real business.** This project was built as a design and engineering showcase, with all product data, pricing, and branding fictionalized for demonstration purposes.

---

## ✨ Highlights

- **AI Scent Finder** — a conversational quiz that matches customers to fragrances using a transparent, weighted scoring algorithm — solving the single biggest trust gap in online perfume retail: *you can't smell a screen.*
- **Full customer journey** — Home → Shop → Product → Cart → Checkout → Confirmation, all wired together with persistent cart state.
- **Admin Dashboard** — manage products and view/update customer orders, with an AI-assisted product description generator.
- **Dark, luxury-forward design system** — built from shared design tokens, fully responsive, accessible (ARIA throughout), and SEO-optimized (structured data, Open Graph, semantic HTML) for both traditional search and AI-driven search engines.

---

## 🖥️ Pages

| Page | Description |
|---|---|
| `home.html` | Home — hero, gender/mood filters, featured products, brand story |
| `shop.html` | Full catalogue (50 products) with search, multi-filter sidebar, sort, and pagination |
| `product.html` | Product detail — gallery, size/qty selection, scent notes, related products |
| `scent-finder.html` | AI-powered quiz that recommends top 3 matches from the catalogue |
| `cart.html` | Cart review with quantity controls and order summary |
| `order.html` | Checkout — delivery/pickup selection, form validation, confirmation screen |
| `about.html` | Brand story, values, FAQ accordion, delivery & returns policy, location |
| `admin/home.html` | Password-protected dashboard — product CRUD + order management |

---

## 🧠 How the AI Scent Finder Works

The Scent Finder asks 5 quick questions (gender, occasion, scent family, intensity, budget) and scores every product in the catalogue against the answers using weighted criteria:

| Criteria | Weight |
|---|---|
| Gender match | +25 |
| Mood/occasion match | +30 |
| Scent family match | +30 |
| Intensity (inferred from scent family) | +10 |
| Budget fit | +15 |
| Bestseller signal | +5 |

The top 3 highest-scoring products are returned with a calculated match percentage and a human-readable explanation built from which criteria actually matched (e.g. *"crafted for women and perfect for date night"*).

This is a **rule-based v1** — fast, free, fully client-side, and fully explainable. A natural next step (v2) would connect this flow to a real LLM via a backend API, allowing free-text input ("something for a beach wedding at sunset") and richer, more nuanced reasoning over the same product data.

---

## 🗂️ Project Structure

```
qton-perfumes/
│
├── home.html
├── shop.html
├── product.html
├── scent-finder.html
├── cart.html
├── order.html
├── about.html
│
├── admin/
│   └── home.html
│
└── assets/
    ├── css/
    │   ├── global.css          # Design tokens, reset, typography, animations
    │   ├── components.css      # Shared components (navbar, cards, buttons, footer...)
    │   ├── home.css
    │   ├── shop.css
    │   ├── product.css
    │   ├── cart.css
    │   ├── order.css
    │   ├── about.css
    │   ├── scent-finder.css
    │   └── admin.css
    │
    └── js/
        ├── products.js         # Single source of truth — all 50 products
        ├── cart.js             # Cart state management (persisted to localStorage)
        ├── global.js           # Shared behaviours: navbar, toast, smooth scroll
        ├── home.js
        ├── shop.js
        ├── product.js
        ├── cart-page.js
        ├── order.js
        ├── about.js
        ├── scent-finder.js
        └── admin.js
```

---

## 🏗️ Architecture Notes

### Design System
All visual styling flows from **design tokens** defined once in `global.css` (`:root` CSS variables for color, type, spacing, easing). `components.css` then builds every reusable UI piece — navbar, product cards, buttons, toasts, pagination, footer — on top of those tokens. Each page's own stylesheet (`home.css`, `shop.css`, etc.) contains **only** what's unique to that page. This means a brand color or font change happens in exactly one place and propagates everywhere.

### Data Flow
`products.js` is the single source of truth for the catalogue, imported by every page that displays products. `cart.js` exposes a small public API (`add`, `remove`, `updateQty`, `getTotal`, etc.) backed by `localStorage`, so the cart persists across page navigation and browser refreshes — every page reads and writes through this one module rather than managing its own state.

### Front-End-Only Limitation
This project has **no backend or database**. The admin dashboard's product edits and the orders placed at checkout are stored in the browser's own `localStorage`. This means:
- Admin changes are visible only in the browser that made them — not pushed live to other visitors
- Orders placed by customers are only visible in *their* browser's admin view, not a shared dashboard

A production version would need a real backend (e.g. Node.js + a database, or a service like Supabase/Firebase) so the admin dashboard and storefront read from the same live data source.

### Placeholder Visuals
Product images are represented with emoji rather than photography. This was an intentional choice for the showcase: it keeps the focus on UI/UX and interaction design, avoids any IP concerns around using real brand photography, and is a purely mechanical swap to real images later — the data model already separates image representation (`emoji`/`image` field) from everything else.

---

## 🛠️ Tech Stack

- **HTML5** — semantic markup, ARIA accessibility throughout
- **CSS3** — custom properties (design tokens), Grid & Flexbox, no framework
- **Vanilla JavaScript** — no build step, no dependencies
- **localStorage** — client-side persistence for cart, orders, and admin data
- **Schema.org structured data** — `Store`, `Product`, `FAQPage`, `BreadcrumbList`, `CollectionPage` for both traditional and AI-driven search

---

## 🔍 SEO & Discoverability

Every page includes:
- Unique meta titles/descriptions targeting realistic search intent
- Open Graph + Twitter Card tags for social sharing
- JSON-LD structured data (validated against schema.org)
- Semantic HTML and full ARIA labeling
- A dynamically injected `Product` schema per item on `product.html`

---

## 🚀 Running Locally

This is a static site with no build process.

1. Download/clone all files, preserving the folder structure above
2. Serve the folder with any static server, for example:
   ```bash
   npx serve .
   ```
   or open `home.html` directly in a browser
3. **Note:** `localStorage` requires serving over `http://` or `https://` (including `localhost`) — opening via `file://` directly may restrict storage in some browsers

### Admin Access
Navigate to `/admin/home.html` directly (not linked in public navigation, by design).
Default password: `qton2025`
> ⚠️ This is a client-side password check only, visible in source. Not secure for production — a real deployment needs server-side authentication.

---

## 📌 Future Improvements

- [ ] Real backend + database (orders/products shared across all users)
- [ ] Real product photography
- [ ] M-Pesa payment integration
- [ ] LLM-powered v2 of the Scent Finder (free-text input)
- [ ] Server-side admin authentication
- [ ] Natural language product search on the Shop page

---

## 📄 License

This is a personal portfolio/demo project. Product names and brands referenced are used illustratively for design demonstration purposes only.

---

**Built by [Alan Macharia]** — feel free to connect on [LinkedIn](https://www.linkedin.com/in/alan-macharia-ai/) to discuss the build.