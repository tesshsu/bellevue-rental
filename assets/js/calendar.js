/* ── calendar.js — availability calendar (booked vs. available) ────
   Vanilla JS, no external calendar library — renders two month grids
   (this month + next), lets guests click a check-in then a check-out
   date, and reports the selection back to booking.js via
   onSelectionChange(checkinISO, checkoutISO).
   Dates are handled as plain 'YYYY-MM-DD' strings (local, no
   timezone math needed since we only ever compare calendar days).
*/
'use strict';

const BR_DOW = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const BR_MONTH_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

let _brBookedRanges = [];   // [{start:'YYYY-MM-DD', end:'YYYY-MM-DD' (exclusive)}]
let _brMonthOffset = 0;     // 0 = current month, 1 = next, etc. First card shows offset, second shows offset+1
let _brSelStart = null;
let _brSelEnd = null;
let _brOnSelectionChange = null;

function brToday() {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
}

function brISO(date) {
  return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
}

function brAddMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth()+n, 1);
}

function brIsBooked(iso) {
  return _brBookedRanges.some(r => r.start && r.end && iso >= r.start && iso < r.end);
}

// True if any date in [startIso, endIso) is booked or in the past — used
// both by the calendar UI and by booking.js when dates are typed manually.
function brRangeHasConflict(startIso, endIso) {
  if (!startIso || !endIso || endIso <= startIso) return true;
  const todayIso = brISO(brToday());
  let cur = new Date(startIso + 'T00:00:00');
  const end = new Date(endIso + 'T00:00:00');
  while (cur < end) {
    const iso = brISO(cur);
    if (iso < todayIso || brIsBooked(iso)) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

function brInitCalendar(onSelectionChange) {
  _brOnSelectionChange = onSelectionChange;
  subscribeBookedRanges(ranges => {
    _brBookedRanges = ranges;
    brRenderCalendars();
  });
  document.getElementById('br-cal-prev')?.addEventListener('click', () => {
    if (_brMonthOffset > 0) { _brMonthOffset--; brRenderCalendars(); }
  });
  document.getElementById('br-cal-next')?.addEventListener('click', () => {
    _brMonthOffset++; brRenderCalendars();
  });
}

function brRenderCalendars() {
  const base = brAddMonths(brToday(), _brMonthOffset);
  brRenderOneMonth('br-cal-1', base);
  brRenderOneMonth('br-cal-2', brAddMonths(base, 1));
  const prevBtn = document.getElementById('br-cal-prev');
  if (prevBtn) prevBtn.disabled = _brMonthOffset <= 0;
}

function brRenderOneMonth(elId, monthDate) {
  const el = document.getElementById(elId);
  if (!el) return;
  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month+1, 0).getDate();
  // Monday-first offset
  const startOffset = (firstDay.getDay() + 6) % 7;
  const todayIso = brISO(brToday());

  let cells = BR_DOW.map(d => `<div class="br-cal-dow">${d}</div>`).join('');
  for (let i = 0; i < startOffset; i++) cells += '<div class="br-cal-day br-empty"></div>';

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const iso = brISO(date);
    let cls = 'br-cal-day';
    let clickable = false;

    if (iso < todayIso) {
      cls += ' br-past';
    } else if (brIsBooked(iso)) {
      cls += ' br-booked';
    } else {
      cls += ' br-avail';
      clickable = true;
    }

    if (_brSelStart && iso === _brSelStart) cls += ' br-selected';
    else if (_brSelEnd && iso === _brSelEnd) cls += ' br-selected';
    else if (_brSelStart && _brSelEnd && iso > _brSelStart && iso < _brSelEnd) cls += ' br-in-range';

    cells += `<div class="${cls}" ${clickable ? `onclick="brOnDayClick('${iso}')"` : ''}>${day}</div>`;
  }

  el.innerHTML = `
    <div class="br-cal-head"><div class="br-cal-title">${BR_MONTH_FMT.format(monthDate)}</div></div>
    <div class="br-cal-grid">${cells}</div>
    <div class="br-cal-legend">
      <span><span class="br-cal-legend-dot" style="background:#dcfce7;"></span>Disponible · Available</span>
      <span><span class="br-cal-legend-dot" style="background:#fee2e2;"></span>Réservé · Booked</span>
      <span><span class="br-cal-legend-dot" style="background:#059669;"></span>Votre sélection · Your selection</span>
    </div>`;
}

function brOnDayClick(iso) {
  if (!_brSelStart || (_brSelStart && _brSelEnd)) {
    // Start a fresh selection
    _brSelStart = iso;
    _brSelEnd = null;
  } else if (iso <= _brSelStart) {
    // Clicked before/at current start — restart from here
    _brSelStart = iso;
    _brSelEnd = null;
  } else if (brRangeHasConflict(_brSelStart, iso)) {
    // Overlaps a booked date — restart selection at the clicked day instead
    _brSelStart = iso;
    _brSelEnd = null;
  } else {
    _brSelEnd = iso;
  }
  brRenderCalendars();
  if (_brOnSelectionChange) _brOnSelectionChange(_brSelStart, _brSelEnd);
}

// Allows booking.js to push a selection made via the manual date inputs
// back into the calendar view (keeps both in sync).
function brSetSelectionExternal(startIso, endIso) {
  _brSelStart = startIso || null;
  _brSelEnd = endIso || null;
  if (_brSelStart) {
    const d = new Date(_brSelStart + 'T00:00:00');
    _brMonthOffset = (d.getFullYear() - brToday().getFullYear()) * 12 + (d.getMonth() - brToday().getMonth());
    if (_brMonthOffset < 0) _brMonthOffset = 0;
  }
  brRenderCalendars();
}
