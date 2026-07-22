/* ── booking.js — gallery, price calculation, booking form ─────────
   Vanilla JS, no build step. Everything the owner needs to tweak
   (price, minimum stay, guest cap, Formspree endpoint) is a single
   constant at the top of this file.
*/
'use strict';

// ── Editable settings — TODO: update these to your real values ────
const BR_PRICE_PER_NIGHT = 75;   // €/night — TODO replace with your real rate
const BR_MIN_NIGHTS      = 2;    // minimum stay in nights
const BR_MAX_GUESTS      = 3;    // 1 adult, or 1 adult + 1 child (per the listing)
const BR_FORMSPREE_URL   = 'https://formspree.io/f/xykrdgpa';

// 1x1 transparent-ish grey placeholder shown until a real photo file exists
const BR_PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
       <rect width="100%" height="100%" fill="#e2e8f0"/>
       <text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#94a3b8"
             text-anchor="middle" dominant-baseline="middle">Photo à venir</text>
     </svg>`);

/* ── Gallery ───────────────────────────────────────────────────── */
let _brFlatPhotos = [];
let _brLightboxIndex = 0;

function brRenderGallery() {
  const container = document.getElementById('br-gallery');
  if (!container || typeof STUDIO_PHOTOS === 'undefined') return;

  const byCategory = {};
  STUDIO_PHOTOS.forEach(p => {
    (byCategory[p.category] = byCategory[p.category] || []).push(p);
  });
  _brFlatPhotos = STUDIO_PHOTOS;

  container.innerHTML = Object.entries(byCategory).map(([cat, photos]) => `
    <div class="br-gallery-cat">
      <div class="br-gallery-cat-title"><i class="fas fa-image"></i> ${cat}</div>
      <div class="br-gallery-grid">
        ${photos.map(p => {
          const idx = _brFlatPhotos.indexOf(p);
          return `
          <div class="br-photo" onclick="brOpenLightbox(${idx})">
            <img src="${p.file}" alt="${p.alt}" loading="lazy"
                 onerror="this.onerror=null;this.src='${BR_PLACEHOLDER_IMG}';">
            <div class="br-photo-caption">${p.alt}</div>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

function brOpenLightbox(index) {
  _brLightboxIndex = index;
  brRenderLightbox();
  document.getElementById('br-lightbox').classList.remove('hidden');
}

function brCloseLightbox() {
  document.getElementById('br-lightbox').classList.add('hidden');
}

function brLightboxNav(delta) {
  _brLightboxIndex = (_brLightboxIndex + delta + _brFlatPhotos.length) % _brFlatPhotos.length;
  brRenderLightbox();
}

function brRenderLightbox() {
  const p = _brFlatPhotos[_brLightboxIndex];
  if (!p) return;
  const img = document.getElementById('br-lightbox-img');
  img.src = p.file;
  img.onerror = () => { img.onerror = null; img.src = BR_PLACEHOLDER_IMG; };
  img.alt = p.alt;
  document.getElementById('br-lightbox-caption').textContent = p.alt;
}

/* ── Price summary / form validation ──────────────────────────── */
function brNightsBetween(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const ms = new Date(endIso + 'T00:00:00') - new Date(startIso + 'T00:00:00');
  return Math.round(ms / 86400000);
}

function brRecomputeSummary() {
  const startIso = document.getElementById('br-checkin').value;
  const endIso   = document.getElementById('br-checkout').value;
  const summaryEl = document.getElementById('br-price-summary');
  const submitBtn = document.getElementById('br-submit-btn');
  const nights = brNightsBetween(startIso, endIso);

  if (!startIso || !endIso) {
    summaryEl.classList.remove('br-invalid');
    summaryEl.innerHTML = `<span class="br-price-summary-line">Choisissez vos dates d'arrivée et de départ ci-dessus · Pick your check-in and check-out dates above</span>`;
    submitBtn.disabled = true;
    return;
  }

  if (nights <= 0) {
    summaryEl.classList.add('br-invalid');
    summaryEl.innerHTML = `<span class="br-price-summary-line"><i class="fas fa-exclamation-triangle"></i> La date de départ doit être après la date d'arrivée · Check-out must be after check-in</span>`;
    submitBtn.disabled = true;
    return;
  }

  if (nights < BR_MIN_NIGHTS) {
    summaryEl.classList.add('br-invalid');
    summaryEl.innerHTML = `<span class="br-price-summary-line"><i class="fas fa-exclamation-triangle"></i> Séjour minimum : ${BR_MIN_NIGHTS} nuits · ${BR_MIN_NIGHTS}-night minimum stay</span>`;
    submitBtn.disabled = true;
    return;
  }

  if (typeof brRangeHasConflict === 'function' && brRangeHasConflict(startIso, endIso)) {
    summaryEl.classList.add('br-invalid');
    summaryEl.innerHTML = `<span class="br-price-summary-line"><i class="fas fa-exclamation-triangle"></i> Une ou plusieurs de ces dates sont déjà réservées · One or more of these dates are already booked</span>`;
    submitBtn.disabled = true;
    return;
  }

  const total = nights * BR_PRICE_PER_NIGHT;
  summaryEl.classList.remove('br-invalid');
  summaryEl.innerHTML = `
    <span class="br-price-summary-line">${nights} nuit${nights > 1 ? 's' : ''} × €${BR_PRICE_PER_NIGHT} · ${nights} night${nights > 1 ? 's' : ''}</span>
    <span class="br-price-summary-total">Total : €${total}</span>`;
  submitBtn.disabled = false;

  document.getElementById('br-hidden-nights').value = nights;
  document.getElementById('br-hidden-total').value = total;
}

function brOnCalendarSelectionChange(startIso, endIso) {
  document.getElementById('br-checkin').value = startIso || '';
  document.getElementById('br-checkout').value = endIso || '';
  brRecomputeSummary();
}

function brOnDateInputChange() {
  const checkinEl = document.getElementById('br-checkin');
  const checkoutEl = document.getElementById('br-checkout');
  if (checkinEl.value) {
    const minCheckout = new Date(checkinEl.value + 'T00:00:00');
    minCheckout.setDate(minCheckout.getDate() + 1);
    checkoutEl.min = minCheckout.toISOString().slice(0, 10);
  }
  if (typeof brSetSelectionExternal === 'function') brSetSelectionExternal(checkinEl.value, checkoutEl.value);
  brRecomputeSummary();
}

/* ── Form submission (AJAX to Formspree, no page reload) ─────────── */
async function brSubmitBooking(evt) {
  evt.preventDefault();
  const form = evt.target;
  const btn = document.getElementById('br-submit-btn');
  const successEl = document.getElementById('br-form-success');
  const errorEl = document.getElementById('br-form-error');
  successEl.style.display = 'none';
  errorEl.style.display = 'none';

  btn.disabled = true;
  const originalLabel = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi…';

  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      successEl.style.display = 'flex';
      form.reset();
      if (typeof brSetSelectionExternal === 'function') brSetSelectionExternal(null, null);
      brRecomputeSummary();
    } else {
      throw new Error('Formspree returned ' + res.status);
    }
  } catch (e) {
    console.warn('[booking] submit error', e);
    errorEl.style.display = 'flex';
  } finally {
    btn.innerHTML = originalLabel;
    btn.disabled = false;
  }
}

/* ── Init ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  brRenderGallery();

  document.getElementById('br-price-display').textContent = '€' + BR_PRICE_PER_NIGHT;
  document.getElementById('br-min-nights-display').textContent = BR_MIN_NIGHTS;
  document.getElementById('br-max-guests-display').textContent = BR_MAX_GUESTS;
  document.getElementById('br-quickfact-guests').textContent = '1-' + BR_MAX_GUESTS + ' pers.';

  const guestSelect = document.getElementById('br-guests');
  if (guestSelect) {
    guestSelect.innerHTML = Array.from({ length: BR_MAX_GUESTS }, (_, i) => i + 1)
      .map(n => `<option value="${n}">${n} personne${n > 1 ? 's' : ''}</option>`).join('');
  }

  if (typeof brInitCalendar === 'function') brInitCalendar(brOnCalendarSelectionChange);

  const todayIso = new Date().toISOString().slice(0, 10);
  const checkinEl = document.getElementById('br-checkin');
  if (checkinEl) checkinEl.min = todayIso;

  document.getElementById('br-checkin')?.addEventListener('change', brOnDateInputChange);
  document.getElementById('br-checkout')?.addEventListener('change', brOnDateInputChange);
  document.getElementById('br-booking-form')?.addEventListener('submit', brSubmitBooking);

  document.getElementById('br-lightbox-close')?.addEventListener('click', brCloseLightbox);
  document.getElementById('br-lightbox-prev')?.addEventListener('click', () => brLightboxNav(-1));
  document.getElementById('br-lightbox-next')?.addEventListener('click', () => brLightboxNav(1));
  document.getElementById('br-lightbox')?.addEventListener('click', e => {
    if (e.target.id === 'br-lightbox') brCloseLightbox();
  });
  document.addEventListener('keydown', e => {
    const lb = document.getElementById('br-lightbox');
    if (!lb || lb.classList.contains('hidden')) return;
    if (e.key === 'Escape') brCloseLightbox();
    if (e.key === 'ArrowLeft') brLightboxNav(-1);
    if (e.key === 'ArrowRight') brLightboxNav(1);
  });

  brRecomputeSummary();
});
