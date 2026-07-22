/* ── ui.js — language toggle, hero carousel, sticky booking bar ─────
   Cross-cutting page chrome that isn't specific to the gallery,
   calendar, or booking form (those stay in their own files).
*/
'use strict';

/* ── Language toggle ───────────────────────────────────────────── */
// The heavy lifting (hiding/showing .lang-fr/.lang-en/.lang-tw) is pure
// CSS driven by html[data-lang] — see style.css. This just wires the
// buttons and gives JS-generated strings (price summary, <option> text)
// a way to match whatever language is currently selected.
function brCurrentLang() {
  return document.documentElement.getAttribute('data-lang') || 'fr';
}

function brT(fr, en, tw) {
  const lang = brCurrentLang();
  if (lang === 'en') return en;
  if (lang === 'tw') return tw;
  return fr;
}

function brSetLang(lang) {
  document.documentElement.setAttribute('data-lang', lang);
  localStorage.setItem('br_lang', lang);
  document.querySelectorAll('#br-lang-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.langBtn === lang);
  });
  document.dispatchEvent(new CustomEvent('br:langchange', { detail: { lang } }));
}

/* ── Hero image carousel ───────────────────────────────────────── */
const BR_HERO_PHOTOS = [
  'assets/photos/piscine.avif',
  'assets/photos/garden.avif',
  'assets/photos/outside2.webp',
  'assets/photos/patio.jpg'
];

let _brHeroIndex = 0;
let _brHeroTimer = null;

function brLoadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function brInitHeroCarousel() {
  const track = document.getElementById('br-hero-carousel');
  const dotsEl = document.getElementById('br-hero-dots');
  if (!track || !dotsEl) return;

  const results = await Promise.all(BR_HERO_PHOTOS.map(brLoadImage));
  const usable = results.filter(Boolean);
  if (usable.length === 0) return; // CSS gradient fallback on .br-hero still applies

  track.innerHTML = usable.map((src, i) =>
    `<div class="br-hero-slide${i === 0 ? ' active' : ''}" style="background-image:url('${src}')"></div>`
  ).join('');
  dotsEl.innerHTML = usable.map((_, i) =>
    `<button type="button" class="br-hero-dot${i === 0 ? ' active' : ''}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>`
  ).join('');

  dotsEl.querySelectorAll('.br-hero-dot').forEach(dot => {
    dot.addEventListener('click', () => brGoToHeroSlide(parseInt(dot.dataset.slide, 10)));
  });

  if (usable.length > 1) {
    _brHeroTimer = setInterval(() => brGoToHeroSlide((_brHeroIndex + 1) % usable.length), 5000);
  }
}

function brGoToHeroSlide(index) {
  const track = document.getElementById('br-hero-carousel');
  const dotsEl = document.getElementById('br-hero-dots');
  if (!track || !dotsEl) return;
  _brHeroIndex = index;
  track.querySelectorAll('.br-hero-slide').forEach((el, i) => el.classList.toggle('active', i === index));
  dotsEl.querySelectorAll('.br-hero-dot').forEach((el, i) => el.classList.toggle('active', i === index));
  if (_brHeroTimer) { clearInterval(_brHeroTimer); _brHeroTimer = null; }
}

/* ── Sticky booking bar ────────────────────────────────────────── */
function brInitStickyBar() {
  const hero = document.getElementById('br-hero');
  const bar = document.getElementById('br-sticky-bar');
  if (!hero || !bar) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => bar.classList.toggle('visible', !entry.isIntersecting));
  }, { threshold: 0 });
  observer.observe(hero);
}

/* ── Init ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#br-lang-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.langBtn === brCurrentLang());
    btn.addEventListener('click', () => brSetLang(btn.dataset.langBtn));
  });

  brInitHeroCarousel();
  brInitStickyBar();
});
