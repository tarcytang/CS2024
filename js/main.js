/* =========================================================
   DEKATRE — shared script (loaded on every page)
   - Builds the header, footer and mobile bar, so edit the menu ONCE here.
   - All "Buy" buttons go to Shopee. There is no cart on this site.
   - Points and discount codes are saved per account in the browser.
   ========================================================= */

/* ---------- SHOPEE LINKS ---------- */
const SHOPEE_BUNDLE = "https://sg.shp.ee/14FsYAcr";   // the C-Defense bundle listing
const shopeeSearch = q => "https://shopee.sg/search?keyword=" + encodeURIComponent(q);

/* ---------- PRODUCTS ----------
   PRICES: replace with the current prices on the Shopee listing.
   Ingredients and certifications are taken from the packaging and Wardah's product descriptions. */
const PRODUCTS = {
  wash: {
    name: "C-Defense Radiant Creamy Wash", short: "Creamy Wash", price: 12.90, img: "images/wash.png",
    shopee: shopeeSearch("Wardah C-Defense Creamy Wash"),
    benefit: "Deep cleanse for brighter skin",
    problem: "Sweat, oil, sunscreen and grime building up on skin",
    how: "A creamy, gentle cleanser that lifts away the day's sweat, oil and dirt without leaving skin tight.",
    ingredients: [
      ["Vitamin C", "Antioxidant that helps skin look brighter and more even"],
      ["Panthenol (pro-vitamin B5)", "Helps skin hold on to moisture, so it doesn't feel stripped after washing"]
    ],
    certs: ["Halal certified"]
  },
  mist: {
    name: "C-Defense Vitamin C Allantoin Face Mist", short: "Face Mist", price: 13.90, img: "images/mist.png", size: "55 ml",
    shopee: shopeeSearch("Wardah C-Defense Face Mist"),
    benefit: "Instant hydration and refreshment",
    problem: "Tight, dehydrated skin from heat and air-conditioning",
    how: "A light mist you can spray over bare skin or makeup to rehydrate and refresh during the day.",
    ingredients: [
      ["Vitamin C", "Antioxidant for a healthy-looking glow"],
      ["Allantoin", "Soothes and calms skin that feels irritated"],
      ["Sodium PCA", "Part of skin's own natural moisturising factor, helps keep skin hydrated"]
    ],
    certs: ["Halal certified", "Mild and soothing formula"]
  },
  mask: {
    name: "C-Defense Superserum Mask", short: "Superserum Mask", price: 4.90, img: "images/mask.png", size: "1 sheet",
    shopee: shopeeSearch("Wardah C-Defense Superserum Mask"),
    benefit: "Intensive hydration and glow boost",
    problem: "Dull, tired-looking skin",
    how: "A serum-soaked sheet mask for a concentrated dose of hydration and vitamin C, 2 to 3 times a week.",
    ingredients: [
      ["Vitamin C", "Brightens and helps even out skin tone"],
      ["Orange extract", "Plant extract that pairs with vitamin C for a healthy glow"]
    ],
    certs: ["Halal certified", "Dermatologically tested", "Non-alcohol", "For all skin types", "100% organic cotton sheet", "Biodegradable sheet"]
  },
  moisturiser: {
    name: "C-Defense Mousse Moisturiser", short: "Mousse Moisturiser", price: 16.90, img: "images/moisturiser.png", size: "30 g",
    shopee: shopeeSearch("Wardah C-Defense Mousse Moisturizer"),
    benefit: "Lightweight moisture that doubles as a primer",
    problem: "Dryness, or makeup that slides off in humidity",
    how: "A soft, velvety mousse that hydrates and blurs pores with a fresh matte finish, so it works under makeup too.",
    ingredients: [
      ["Vitamin C", "Antioxidant for brighter, smoother-looking skin"],
      ["Moistprime technology", "Wardah's 2-in-1 moisturiser and primer base, for hydration with a matte finish"]
    ],
    certs: ["Halal certified", "Dermatologically tested", "Non-comedogenic (won't clog pores)"]
  },
  ddcream: {
    name: "C-Defense DD Cream SPF 30", short: "DD Cream SPF 30", price: 15.90, img: "images/ddcream.png", size: "20 ml",
    shopee: shopeeSearch("Wardah C-Defense DD Cream"),
    benefit: "Sun protection with a light tint",
    problem: "Sun damage, dark spots and uneven skin tone",
    how: "A tinted cream that evens out skin tone and protects against UVA and UVB as the last step of your morning.",
    ingredients: [
      ["Vitamin C", "Helps brighten skin tone"],
      ["Hexapeptide", "A peptide that helps skin texture look smoother"],
      ["SPF 30 PA+++", "SPF 30 protects against UVB (burning); PA+++ means high protection against UVA (ageing)"]
    ],
    certs: ["Halal certified", "SPF 30 PA+++"]
  }
};

/* ---------- BUNDLES ---------- */
const BUNDLES = {
  full: {
    name: "C-Defense Complete Bundle", price: 54.90, items: ["wash", "mist", "mask", "moisturiser", "ddcream"],
    shopee: SHOPEE_BUNDLE,
    blurb: "All five products for a full morning and night routine."
  },
  student: {
    name: "Student Starter Bundle", price: 36.90, items: ["wash", "mist", "ddcream"],
    shopee: shopeeSearch("Wardah C-Defense"),
    blurb: "The three essentials for long school days: cleanse, refresh, protect.",
    code: "DKSTUDENT15", discount: 15
  }
};
const bundleWorth = b => b.items.reduce((a, id) => a + PRODUCTS[id].price, 0);

/* a student is anyone whose account uses a school email (ends in .edu.sg or .edu) */
const isStudentEmail = e => /\.edu(\.sg)?$/i.test(e || "");

/* ---------- safe storage (works even if storage is blocked) ---------- */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("dekatre_" + key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("dekatre_" + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
  }
};

/* ---------- accounts ----------
   PROTOTYPE ONLY: accounts are saved in this browser (no server/database).
   Passwords are stored as a SHA-256 hash, never as plain text. */
const Auth = {
  users() { return store.get("users", {}); },
  current() { const e = store.get("session", null); const u = this.users(); return e && u[e] ? u[e] : null; },
  email() { const u = this.current(); return u ? u.email : null; },
  async hash(email, password) {
    const text = email.toLowerCase() + ":" + password;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    let h = 0; for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0; return "x" + h; // fallback
  },
  async signUp({ name, email, password, marketing }) {
    email = email.trim().toLowerCase();
    const u = this.users();
    if (u[email]) return { ok: false, error: "An account with this email already exists. Log in instead." };
    u[email] = { name: name.trim(), email, hash: await this.hash(email, password), marketing: !!marketing, created: new Date().toISOString() };
    store.set("users", u); store.set("session", email);
    store.set("points__" + email, { balance: 50, earned: 50, redeemed: 0, history: [{ text: "Welcome bonus for signing up", pts: 50, date: new Date().toISOString() }] });
    return { ok: true };
  },
  async logIn(email, password) {
    email = email.trim().toLowerCase();
    const u = this.users()[email];
    if (!u || u.hash !== await this.hash(email, password)) return { ok: false, error: "That email and password don't match. Check them and try again." };
    store.set("session", email); return { ok: true };
  },
  logOut() { store.set("session", null); }
};

/* storage that belongs to the logged-in account (points, vouchers, spins, quiz) */
const ustore = {
  key(k) { return k + "__" + (Auth.email() || "guest"); },
  get(k, f) { return store.get(this.key(k), f); },
  set(k, v) { store.set(this.key(k), v); }
};

/* HTML for a "log in to continue" panel. Use: el.innerHTML = loginPrompt("…") */
function loginPrompt(text) {
  const next = encodeURIComponent(location.pathname.split("/").pop() || "index.html");
  return `<div class="panel"><h2 style="font-size:1.9rem">Log in to collect points</h2><p>${text}</p>
    <div class="btn-row" style="margin-top:.5rem"><a class="btn" href="login.html?mode=signup&next=${next}">Create an account</a>
    <a class="btn btn--ghost" href="login.html?next=${next}">Log in</a></div>
    <p class="small muted" style="margin:1rem 0 0">New accounts get 50 welcome points.</p></div>`;
}

/* ---------- points ---------- */
const Points = {
  get() {
    return ustore.get("points", { balance: 0, earned: 0, redeemed: 0, history: [] });
  },
  add(pts, text) {
    if (!Auth.current()) return false;   // guests can't earn points
    const p = this.get(); p.balance += pts; p.earned += pts;
    p.history.unshift({ text, pts, date: new Date().toISOString() });
    ustore.set("points", p); updateHeaderCounts(); return true;
  },
  spend(pts, text) {
    if (!Auth.current()) return false;
    const p = this.get(); if (p.balance < pts) return false;
    p.balance -= pts; p.redeemed += pts;
    p.history.unshift({ text, pts: -pts, date: new Date().toISOString() });
    ustore.set("points", p); updateHeaderCounts(); return true;
  }
};

/* ---------- discount codes ----------
   Rewards are given as codes to type in at Shopee checkout.
   PROTOTYPE: in a real launch, each code would be created as a Shopee shop voucher. */
const Codes = {
  get() { return Auth.current() ? ustore.get("codes", []) : []; },
  add({ label, prefix }) {
    if (!Auth.current()) return null;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = ""; for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    const code = { id: "C" + Date.now(), code: `DK${prefix}-${rand}`, label,
      expires: new Date(Date.now() + 30 * 864e5).toISOString() };
    const all = this.get(); all.unshift(code); ustore.set("codes", all); return code;
  },
  remove(id) { ustore.set("codes", this.get().filter(c => c.id !== id)); }
};

/* copy text to clipboard, with a fallback for older browsers */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (x) {} t.remove(); }
  toast(`Copied ${text}`);
}
document.addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copyText(b.dataset.copy); });

/* ---------- money ---------- */
const money = n => "S$" + n.toFixed(2);

/* ---------- Shopee button HTML ---------- */
function shopeeButton(href, label = "Buy on Shopee", extra = "") {
  return `<a class="btn btn--shopee ${extra}" href="${href}" target="_blank" rel="noopener">${label}<span class="visually-hidden"> (opens Shopee in a new tab)</span>
    <svg viewBox="0 0 24 24" aria-hidden="true" class="ext"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>`;
}

/* ---------- light / night theme ---------- */
const Theme = {
  get() { return document.documentElement.dataset.theme === "dark" ? "dark" : "light"; },
  set(t) {
    if (t === "dark") document.documentElement.dataset.theme = "dark"; else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("dekatre_theme", t); } catch (e) {}
    document.querySelectorAll("[data-theme-toggle]").forEach(b => {
      b.setAttribute("aria-pressed", t === "dark");
      b.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode");
      b.innerHTML = t === "dark" ? SUN_ICON : MOON_ICON;
    });
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === "dark" ? "#111214" : "#f6f6ee";
  }
};
const SUN_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
const MOON_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>';

/* ---------- toast ---------- */
function toast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show");
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.remove("show"), 2600);
}


/* ---------- logo ---------- */
const LOGO_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">
  <circle cx="16" cy="18" r="10" stroke="#e8913f"/>
  <path d="M6 18h20M16 8c-3.5 3-3.5 17 0 20M16 8c3.5 3 3.5 17 0 20" stroke="#e8913f" stroke-width="1.2"/>
  <path d="M16 1.5v3M4.5 6l2 2M27.5 6l-2 2" stroke="currentColor"/></svg>`;
const CHEVRON = `<svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>`;

/* ---------- MENU — edit pages here ---------- */
const MENU = [
  { label: "Shop", href: "products.html" },
  { label: "Skin quiz", href: "skin-quiz.html", highlight: true },
  { label: "Skincare", items: [
    { label: "Routine guide", href: "routine.html", desc: "Morning and night steps" },
    { label: "Ingredients", href: "science.html#ingredients", desc: "What's inside each product" },
    { label: "Reviews", href: "community.html", desc: "Real routines from real skin" }
  ]},
  { label: "Learn", items: [
    { label: "Your skin and the weather", href: "climate.html", desc: "Heat, humidity, haze and sun" },
    { label: "The science", href: "science.html", desc: "Why vitamin C, hydration and SPF" }
  ]},
  { label: "Rewards", items: [
    { label: "Skin trivia", href: "climate-quiz.html", desc: "Answer questions, earn points" },
    { label: "Spin the wheel", href: "spin.html", desc: "One free spin a day" },
    { label: "Rewards wallet", href: "rewards.html", desc: "Points and Shopee codes" }
  ]},
  { label: "App", href: "app.html" },
  { label: "About", href: "team.html" }
];

/* ---------- USER JOURNEY — the "Up next" link at the bottom of each page ---------- */
const JOURNEY = {
  "index.html":        { href: "skin-quiz.html",    title: "Find your skin type", text: "Six quick questions, then a routine made for your skin." },
  "skin-quiz.html":    { href: "routine.html",      title: "Your routine guide",  text: "Morning and night steps, with a checklist and mask timer." },
  "routine.html":      { href: "products.html",     title: "Shop the C-Defense range", text: "Pick the full bundle, the student bundle or single products." },
  "products.html":     { href: "community.html",    title: "Read reviews",        text: "See how people with skin like yours use the routine." },
  "community.html":    { href: "climate-quiz.html", title: "Skin trivia",         text: "Test what you know and earn points towards Shopee codes." },
  "climate-quiz.html": { href: "spin.html",         title: "Spin the wheel",      text: "Your free daily spin for points and discount codes." },
  "spin.html":         { href: "rewards.html",      title: "Rewards wallet",      text: "Turn your points into codes for Shopee." },
  "rewards.html":      { href: "products.html",     title: "Use your code on Shopee", text: "Pick your products and apply your code at checkout." },
  "climate.html":      { href: "science.html",      title: "The science",         text: "How vitamin C, hydration and SPF 30 help." },
  "science.html":      { href: "products.html",     title: "Shop the C-Defense range", text: "See every product's ingredients and certifications." },
  "app.html":          { href: "skin-quiz.html",    title: "Find your skin type", text: "Get your profile ready before you download the app." },
  "team.html":         { href: "products.html",     title: "Shop the C-Defense range", text: "See the five products we built Dekatre around." }
};
function buildJourney(here) {
  const j = JOURNEY[here]; if (!j) return;
  const sec = document.createElement("section");
  sec.className = "journey-next";
  sec.setAttribute("aria-label", "Continue browsing");
  sec.innerHTML = `<div class="wrap"><a class="next-card" href="${j.href}">
      <span class="next-label">Up next</span>
      <span class="next-title">${j.title}</span>
      <span class="next-text">${j.text}</span>
      <svg class="next-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </a></div>`;
  (document.querySelector("main") || document.body).appendChild(sec);
}


/* ---------- MOBILE BOTTOM BAR ---------- */
const ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  shop: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  quiz: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.8v.2"/>',
  rewards: '<path d="M4 9h16v4H4zM6 13h12v7H6zM12 9v11M12 9c-2-4-6-4-6-1s6 1 6 1zM12 9c2-4 6-4 6-1s-6 1-6 1z"/>',
  learn: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>'
};
function buildTabBar(here) {
  const tabs = [
    { label: "Home", href: "index.html", icon: "home", match: ["index.html", ""] },
    { label: "Shop", href: "products.html", icon: "shop", match: ["products.html"] },
    { label: "Skin quiz", href: "skin-quiz.html", icon: "quiz", match: ["skin-quiz.html"], hl: true },
    { label: "Rewards", href: Auth.current() ? "rewards.html" : "climate-quiz.html", icon: "rewards", match: ["rewards.html", "spin.html", "climate-quiz.html", "login.html"] },
    { label: "Learn", href: "climate.html", icon: "learn", match: ["climate.html", "science.html", "routine.html", "community.html"] }
  ];
  const nav = document.createElement("nav");
  nav.className = "tabbar"; nav.setAttribute("aria-label", "Quick links");
  nav.innerHTML = tabs.map(t => `<a href="${t.href}" class="${t.hl ? "tab-hl" : ""}" ${t.match.includes(here) ? 'aria-current="page"' : ""}>
      <span class="tab-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[t.icon]}</svg></span>
      <span>${t.label}</span></a>`).join("");
  document.body.appendChild(nav);
}

function accountItem(here) {
  const u = Auth.current();
  if (!u) return `<li><a href="login.html" ${here === "login.html" ? 'aria-current="page"' : ""}>Log in</a></li>`;
  return `<li class="has-drop"><button class="drop-toggle" aria-expanded="false" aria-controls="ddAcc">
      <span>${u.name.split(" ")[0]}</span><span class="points-pill" data-points>0 pts</span>${CHEVRON}</button>
    <ul class="dropdown dropdown--right" id="ddAcc">
      <li><a href="rewards.html"><span>Rewards wallet<span class="desc">${u.email}</span></span></a></li>
      <li><a href="#" data-logout>Log out</a></li></ul></li>`;
}

function buildHeader() {
  const here = location.pathname.split("/").pop() || "index.html";
  const items = MENU.map((m, i) => {
    if (!m.items) return `<li><a href="${m.href}" class="${m.highlight ? "nav-hl" : ""}" ${m.href === here ? 'aria-current="page"' : ""}>${m.label}</a></li>`;
    const sub = m.items.map(s =>
      `<li><a href="${s.href}" ${s.href === here ? 'aria-current="page"' : ""}><span>${s.label}<span class="desc">${s.desc}</span></span></a></li>`).join("");
    return `<li class="has-drop"><button class="drop-toggle" aria-expanded="false" aria-controls="dd${i}">${m.label}${CHEVRON}</button>
      <ul class="dropdown" id="dd${i}">${sub}</ul></li>`;
  }).join("");

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `<div class="wrap nav">
      <a class="logo" href="index.html">${LOGO_SVG}Dekatre</a>
      <div class="nav-right">
        <ul class="nav-links" id="navlinks">${items}
          ${accountItem(here)}
        </ul>
        <button class="theme-btn" data-theme-toggle type="button"></button>
        <button class="menu-btn" aria-expanded="false" aria-controls="navlinks">Menu</button>
      </div></div>`;
  document.body.prepend(header);
  const main = document.querySelector("main"); if (main && !main.id) main.id = "main";
  const skip = document.createElement("a"); skip.className = "skip-link"; skip.href = "#main"; skip.textContent = "Skip to main content";
  document.body.prepend(skip);

  Theme.set(Theme.get());
  header.querySelector("[data-theme-toggle]").addEventListener("click", () => Theme.set(Theme.get() === "dark" ? "light" : "dark"));

  const menuBtn = header.querySelector(".menu-btn");
  const links = header.querySelector(".nav-links");
  menuBtn.addEventListener("click", () => {
    const open = links.classList.toggle("show");
    menuBtn.setAttribute("aria-expanded", open); menuBtn.textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
  });
  links.addEventListener("click", e => {
    if (e.target.closest("a") && links.classList.contains("show")) {
      links.classList.remove("show"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "Menu"; document.body.style.overflow = "";
    }
  });
  header.querySelectorAll(".drop-toggle").forEach(btn => {
    const li = btn.parentElement;
    const updateExpanded = () => {
      const expanded = window.innerWidth > 1120 && (li.matches(":hover") || li.contains(document.activeElement));
      btn.setAttribute("aria-expanded", String(expanded));
    };
    ["mouseenter", "mouseleave", "focusin", "focusout"].forEach(eventName => li.addEventListener(eventName, updateExpanded));
  });
  const lo = header.querySelector("[data-logout]");
  if (lo) lo.addEventListener("click", e => { e.preventDefault(); Auth.logOut(); location.href = "index.html"; });
}

function buildFooter() {
  const f = document.createElement("footer");
  f.className = "site-footer";
  f.innerHTML = `<div class="wrap">
    <div class="footer-grid">
      <div><a class="logo" href="index.html">${LOGO_SVG}Dekatre</a>
        <p class="muted small" style="margin-top:.75rem">Vitamin C skincare for Singapore skin. Dekatre helps you find the right Wardah C-Defense routine for your skin type, then shop it on Shopee.</p></div>
      <div><h4>Skincare</h4><ul>
        <li><a href="products.html">Shop</a></li><li><a href="skin-quiz.html">Skin quiz</a></li>
        <li><a href="routine.html">Routine guide</a></li><li><a href="community.html">Reviews</a></li></ul></div>
      <div><h4>Learn and earn</h4><ul>
        <li><a href="science.html#ingredients">Ingredients</a></li><li><a href="climate.html">Your skin and the weather</a></li>
        <li><a href="climate-quiz.html">Skin trivia</a></li><li><a href="spin.html">Spin the wheel</a></li></ul></div>
      <div><h4>Dekatre</h4><ul>
        <li><a href="team.html">About us</a></li><li><a href="app.html">Get the app</a></li>
        <li><a href="login.html">Log in or sign up</a></li><li><a href="rewards.html">Rewards wallet</a></li><li><a href="privacy.html">Privacy policy</a></li></ul></div>
    </div>
    <p class="footer-base">© ${new Date().getFullYear()} Dekatre. Wardah and C-Defense are trademarks of their respective owner. Purchases are completed on Shopee. This site gives general skincare information, not medical advice.</p>
  </div>`;
  document.body.appendChild(f);
}

function updateHeaderCounts() {
  if (Auth.current()) document.querySelectorAll("[data-points]").forEach(el => el.textContent = Points.get().balance + " pts");
}

document.addEventListener("DOMContentLoaded", () => {
  const here = location.pathname.split("/").pop() || "index.html";
  buildHeader(); buildJourney(here); buildFooter(); buildTabBar(here); updateHeaderCounts();
});
