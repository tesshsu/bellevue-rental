/* ── booking.js — gallery, price calculation, booking form ─────────
   Vanilla JS, no build step. Everything the owner needs to tweak
   (price, minimum stay, guest cap, Formspree endpoint) is a single
   constant at the top of this file.
*/
'use strict';

// ── Editable settings ─────────────────────────────────────────────
const BR_NIGHTLY_RATE = 85;              // €/night for stays under 1 week
const BR_WEEK_RATES   = [470, 423, 381, 343]; // week 1, 2, 3, 4 (~10% off each extra week)
                                          // week 5+ stays at the week-4 rate
const BR_MIN_NIGHTS   = 1;               // minimum stay in nights
const BR_MAX_GUESTS   = 3;               // 1 adult, or 1 adult + 1 child (per the listing)
const BR_FORMSPREE_URL = 'https://formspree.io/f/xykrdgpa';

// Tiered pricing: nightly rate under 1 week, then a discounted weekly rate
// per full week (~10% cheaper each additional week, capped at week 4's
// rate), plus any leftover days at the nightly rate.
// Matches: 1 night=€85, 1 week=€470, 2 weeks=€893, 3 weeks=€1274, 4 weeks=€1617.
function brComputeStayPrice(nights) {
  if (nights <= 0) return 0;
  const fullWeeks = Math.floor(nights / 7);
  const extraDays = nights % 7;
  let total = 0;
  for (let w = 0; w < fullWeeks; w++) {
    total += BR_WEEK_RATES[Math.min(w, BR_WEEK_RATES.length - 1)];
  }
  total += extraDays * BR_NIGHTLY_RATE;
  return total;
}

// 1x1 transparent-ish grey placeholder shown until a real photo file exists
const BR_PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
       <rect width="100%" height="100%" fill="#e2e8f0"/>
       <text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="#94a3b8"
             text-anchor="middle" dominant-baseline="middle">Photo à venir</text>
     </svg>`);

/* ── Gallery (bento preview + full lightbox) ──────────────────────
   The preview shows one large feature tile (the first photo) plus up
   to 4 more tiles, picked to cover distinct rooms where possible. The
   "show all photos" button and the last tile's overlay both open the
   lightbox at index 0, which can then browse every photo via prev/next.
*/
let _brFlatPhotos = [];
let _brLightboxIndex = 0;

function brBuildBentoPreview() {
  if (_brFlatPhotos.length === 0) return [];
  const featured = _brFlatPhotos[0];
  const seenCats = new Set([featured.category]);
  const preview = [featured];

  for (const p of _brFlatPhotos) {
    if (preview.length >= 5) break;
    if (p !== featured && !seenCats.has(p.category)) {
      preview.push(p);
      seenCats.add(p.category);
    }
  }
  for (const p of _brFlatPhotos) {
    if (preview.length >= 5) break;
    if (!preview.includes(p)) preview.push(p);
  }
  return preview;
}

function brRenderGallery() {
  const container = document.getElementById('br-gallery');
  if (!container || typeof STUDIO_PHOTOS === 'undefined') return;

  _brFlatPhotos = STUDIO_PHOTOS;
  const preview = brBuildBentoPreview();
  const total = _brFlatPhotos.length;

  const tiles = preview.map((p, i) => {
    const idx = _brFlatPhotos.indexOf(p);
    const isFeature = i === 0;
    const isLast = i === preview.length - 1;
    const moreCount = total - preview.length;
    const overlay = (isLast && moreCount > 0)
      ? `<div class="br-bento-more-overlay"><i class="fas fa-images"></i><span>+${moreCount}</span></div>`
      : '';
    return `
      <div class="br-bento-tile${isFeature ? ' br-bento-feature' : ''}" onclick="brOpenLightbox(${idx})">
        <img src="${p.file}" alt="${p.alt}" loading="lazy"
             onerror="this.onerror=null;this.src='${BR_PLACEHOLDER_IMG}';">
        ${overlay}
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="br-bento-grid">${tiles}</div>
    <div style="text-align:center;">
      <button type="button" class="br-show-all-btn" onclick="brOpenLightbox(0)">
        <i class="fas fa-images"></i>
        <span class="lang-fr">Afficher toutes les photos (${total})</span>
        <span class="lang-en">Show all photos (${total})</span>
        <span class="lang-tw">顯示所有照片（${total}）</span>
      </button>
    </div>`;
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
  document.getElementById('br-lightbox-caption').textContent = p.category + ' — ' + p.alt;
}

/* ── Price summary / form validation ──────────────────────────── */
function brNightsBetween(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const ms = new Date(endIso + 'T00:00:00') - new Date(startIso + 'T00:00:00');
  return Math.round(ms / 86400000);
}

function brT_(fr, en, tw) {
  // Falls back to French if ui.js hasn't loaded yet for some reason.
  return typeof brT === 'function' ? brT(fr, en, tw) : fr;
}

const BR_CANCELLATION_FREE_DAYS = 5; // free cancellation up to this many days before check-in

function brUpdatePolicyBadge(startIso) {
  const el = document.getElementById('br-policy-badge-text');
  if (!el) return;
  if (!startIso) {
    el.textContent = brT_(
      `Annulation gratuite jusqu'à ${BR_CANCELLATION_FREE_DAYS} jours avant l'arrivée`,
      `Free cancellation up to ${BR_CANCELLATION_FREE_DAYS} days before check-in`,
      `入住前${BR_CANCELLATION_FREE_DAYS}天可免費取消`
    );
    return;
  }
  const deadline = new Date(startIso + 'T00:00:00');
  deadline.setDate(deadline.getDate() - BR_CANCELLATION_FREE_DAYS);
  const lang = typeof brCurrentLang === 'function' ? brCurrentLang() : 'fr';
  const locale = lang === 'en' ? 'en-GB' : lang === 'tw' ? 'zh-TW' : 'fr-FR';
  const dateStr = deadline.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  el.textContent = brT_(
    `Annulation gratuite jusqu'au ${dateStr}`,
    `Free cancellation until ${dateStr}`,
    `${dateStr} 前可免費取消`
  );
}

function brSetPolicyLock(locked) {
  const submitBtn = document.getElementById('br-submit-btn');
  const hint = document.getElementById('br-policy-hint');
  submitBtn.classList.toggle('br-submit-btn--locked', locked);
  hint?.classList.toggle('br-policy-hint-visible', locked);
}

function brRecomputeSummary() {
  const startIso = document.getElementById('br-checkin').value;
  const endIso   = document.getElementById('br-checkout').value;
  const summaryEl = document.getElementById('br-price-summary');
  const submitBtn = document.getElementById('br-submit-btn');
  const nights = brNightsBetween(startIso, endIso);
  const policyAccepted = document.getElementById('br-policy-accept')?.checked ?? false;

  brUpdatePolicyBadge(startIso);

  if (!startIso || !endIso) {
    // No dates yet — the calendar hint above already guides the user, so
    // stay out of the way instead of floating a redundant message here.
    summaryEl.classList.remove('br-invalid');
    summaryEl.classList.add('br-empty');
    submitBtn.disabled = true;
    brSetPolicyLock(false);
    return;
  }
  summaryEl.classList.remove('br-empty');

  if (nights <= 0) {
    summaryEl.classList.add('br-invalid');
    summaryEl.innerHTML = `<span class="br-price-summary-line"><i class="fas fa-exclamation-triangle"></i> ${brT_("La date de départ doit être après la date d'arrivée", 'Check-out must be after check-in', '退房日期必須晚於入住日期')}</span>`;
    submitBtn.disabled = true;
    brSetPolicyLock(false);
    return;
  }

  if (nights < BR_MIN_NIGHTS) {
    summaryEl.classList.add('br-invalid');
    summaryEl.innerHTML = `<span class="br-price-summary-line"><i class="fas fa-exclamation-triangle"></i> ${brT_(`Séjour minimum : ${BR_MIN_NIGHTS} nuit(s)`, `${BR_MIN_NIGHTS}-night minimum stay`, `最少需入住${BR_MIN_NIGHTS}晚`)}</span>`;
    submitBtn.disabled = true;
    brSetPolicyLock(false);
    return;
  }

  if (typeof brRangeHasConflict === 'function' && brRangeHasConflict(startIso, endIso)) {
    summaryEl.classList.add('br-invalid');
    summaryEl.innerHTML = `<span class="br-price-summary-line"><i class="fas fa-exclamation-triangle"></i> ${brT_('Une ou plusieurs de ces dates sont déjà réservées', 'One or more of these dates are already booked', '部分日期已被預訂')}</span>`;
    submitBtn.disabled = true;
    brSetPolicyLock(false);
    return;
  }

  const total = brComputeStayPrice(nights);
  summaryEl.classList.remove('br-invalid');
  const nightsLabel = brT_(`${nights} nuit${nights > 1 ? 's' : ''}`, `${nights} night${nights > 1 ? 's' : ''}`, `${nights} 晚`);
  summaryEl.innerHTML = `
    <span class="br-price-summary-line">${nightsLabel}</span>
    <span class="br-price-summary-total">${brT_('Total', 'Total', '總計')} : €${total}</span>`;
  // Dates are valid, so the button stays clickable — it only "soft locks"
  // on the policy checkbox, with a hint and a shake on attempted submit
  // (see brSubmitBooking), instead of a silently disabled button.
  submitBtn.disabled = false;
  brSetPolicyLock(!policyAccepted);

  document.getElementById('br-hidden-nights').value = nights;
  document.getElementById('br-hidden-total').value = total;
}

function brUpdateCalHint(startIso, endIso) {
  const hint = document.getElementById('br-cal-hint');
  if (!hint) return;
  if (!startIso) {
    hint.innerHTML = `<span class="lang-fr">👉 Cliquez une date pour commencer</span><span class="lang-en">👉 Click a date to start</span><span class="lang-tw">👉 請點選日期開始</span>`;
  } else if (!endIso) {
    hint.innerHTML = `<span class="lang-fr">✅ Arrivée sélectionnée — choisissez maintenant votre date de départ</span><span class="lang-en">✅ Check-in set — now choose your check-out date</span><span class="lang-tw">✅ 已選擇入住日期，請選擇退房日期</span>`;
  } else {
    hint.innerHTML = `<span class="lang-fr">🎉 Séjour sélectionné — vérifiez le prix ci-dessous</span><span class="lang-en">🎉 Stay selected — check the price below</span><span class="lang-tw">🎉 已選擇入住區間，請至下方確認價格</span>`;
  }
}

function brOnCalendarSelectionChange(startIso, endIso) {
  document.getElementById('br-checkin').value = startIso || '';
  document.getElementById('br-checkout').value = endIso || '';
  brUpdateCalHint(startIso, endIso);
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
  brUpdateCalHint(checkinEl.value, checkoutEl.value);
  brRecomputeSummary();
}

function brNudgePolicyCheckbox() {
  const checkbox = document.getElementById('br-policy-accept');
  const wrap = checkbox?.closest('.br-policy-checkbox');
  if (!checkbox || !wrap) return;
  document.getElementById('br-policy-hint')?.classList.add('br-policy-hint-visible');
  wrap.classList.remove('br-shake');
  void wrap.offsetWidth; // restart the animation if it's already mid-shake
  wrap.classList.add('br-shake');
  checkbox.focus();
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

  if (!document.getElementById('br-policy-accept')?.checked) {
    brNudgePolicyCheckbox();
    return;
  }

  btn.disabled = true;
  const originalLabel = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + brT_('Envoi…', 'Sending…', '傳送中…');

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

function brRebuildGuestSelect() {
  const guestSelect = document.getElementById('br-guests');
  if (!guestSelect) return;
  const prevValue = guestSelect.value;
  guestSelect.innerHTML = Array.from({ length: BR_MAX_GUESTS }, (_, i) => i + 1)
    .map(n => `<option value="${n}">${n} ${brT_(n > 1 ? 'personnes' : 'personne', n > 1 ? 'guests' : 'guest', '人')}</option>`).join('');
  if (prevValue) guestSelect.value = prevValue;
}

/* ── Init ──────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  brRenderGallery();

  document.getElementById('br-min-nights-display').textContent = BR_MIN_NIGHTS;
  document.getElementById('br-max-guests-display').textContent = BR_MAX_GUESTS;
  document.getElementById('br-quickfact-guests').innerHTML =
    `<span class="lang-fr">1-${BR_MAX_GUESTS} pers.</span><span class="lang-en">1-${BR_MAX_GUESTS} guests</span><span class="lang-tw">1-${BR_MAX_GUESTS}人</span>`;

  brRebuildGuestSelect();
  document.addEventListener('br:langchange', () => {
    brRebuildGuestSelect();
    brRecomputeSummary();
    brUpdateCalHint(document.getElementById('br-checkin').value, document.getElementById('br-checkout').value);
  });

  if (typeof brInitCalendar === 'function') brInitCalendar(brOnCalendarSelectionChange);

  const todayIso = new Date().toISOString().slice(0, 10);
  const checkinEl = document.getElementById('br-checkin');
  if (checkinEl) checkinEl.min = todayIso;

  document.getElementById('br-checkin')?.addEventListener('change', brOnDateInputChange);
  document.getElementById('br-checkout')?.addEventListener('change', brOnDateInputChange);
  document.getElementById('br-policy-accept')?.addEventListener('change', brRecomputeSummary);
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
