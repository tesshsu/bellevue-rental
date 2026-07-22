/* ── firebase-config.js — Realtime Database config + read helper ───
   This project uses its OWN Firebase project ("rental-70cb2", separate
   from any other site), so the rental business never shares a database
   with an unrelated project.

   Realtime Database and Google Sign-In (for admin.html) are set up.
   One thing to double-check: Realtime Database → Rules tab should have
   the rules from this repo's README (public read, write restricted to
   tess.hsu@gmail.com) — paste them there and Publish if not done yet.
*/
'use strict';

const BR_FB_CONFIG = {
  apiKey:            'AIzaSyCWQaHmBTgbSkqffun-Qb5aj96oCcq3ElE',
  authDomain:        'rental-70cb2.firebaseapp.com',
  databaseURL:       'https://rental-70cb2-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:         'rental-70cb2',
  storageBucket:     'rental-70cb2.firebasestorage.app',
  messagingSenderId: '523092033927',
  appId:             '1:523092033927:web:6b3103aa783c866bf39322'
};

// Owner's Google account — the only email allowed to write booked dates.
// Must match the rules you publish in Firebase (see README).
const BR_ADMIN_EMAIL = 'tess.hsu@gmail.com';

function brFirebaseReady() {
  return typeof firebase !== 'undefined' && BR_FB_CONFIG.databaseURL.indexOf('TODO_') === -1;
}

function brInitFirebase() {
  if (!brFirebaseReady()) return false;
  if (!firebase.apps.length) firebase.initializeApp(BR_FB_CONFIG);
  return true;
}

// Subscribe to the list of booked date ranges. Calls onData(ranges) on
// every update, where ranges = [{ start:'YYYY-MM-DD', end:'YYYY-MM-DD', note:'...' }, ...]
// `end` is the checkout date (exclusive — the last occupied night is end-1).
// Stored in Firebase as an object keyed by push-id (admin.html adds/removes
// entries by key), which Object.values() flattens into a plain array here.
function subscribeBookedRanges(onData) {
  if (!brInitFirebase()) { onData([]); return; }
  try {
    firebase.database().ref('bookedRanges').on('value', snap => {
      const val = snap.val();
      const arr = val && typeof val === 'object' ? Object.values(val).filter(Boolean) : [];
      onData(arr);
    }, err => {
      console.warn('[firebase-config] read error', err);
      onData([]);
    });
  } catch (e) {
    console.warn('[firebase-config] init error', e);
    onData([]);
  }
}
