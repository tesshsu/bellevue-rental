# Studio Bellevue — booking site 🏡

Direct-booking page for a self-catering studio in Saint-Vallier-de-Thiey
(Alpes-Maritimes) — no Airbnb/Booking commission. Guests browse photos,
house rules, and live availability, then send a booking inquiry that you
approve manually by email.

Live site (once published): `https://tesshsu.github.io/bellevue-rental/`

## What this site does

- **Studio showcase** — photo gallery by room, description, amenities, house rules, check-in info
- **Live availability calendar** — booked vs. available dates, backed by Firebase Realtime Database
- **Booking request form** — auto-calculates total price from selected dates, submits to your inbox via Formspree
- **Admin page** (`admin.html`) — Google Sign-In gated page where you mark confirmed stays as booked; the public calendar updates instantly for everyone, no git push needed

Guests never book automatically — every request goes to your email first
so you can screen guests before confirming, exactly like the Airbnb flow
you're used to.

## Site structure

```
bellevue-rental/
├── index.html                  # Public booking page
├── admin.html                  # Owner-only: mark dates as booked (Google Sign-In)
├── README.md
└── assets/
    ├── css/style.css           # All styles (br- prefixed classes)
    ├── js/
    │   ├── firebase-config.js  # Firebase project config + read helper — EDIT THIS
    │   ├── photos-data.js      # Gallery photo list — EDIT THIS to add real photos
    │   ├── calendar.js         # Availability calendar rendering + date selection
    │   └── booking.js          # Price calc, form submit, gallery/lightbox — price & min-stay constants at top
    └── photos/                 # Drop your real studio photos here
```

## Tech stack

Plain HTML/CSS/JS — **no build step, no npm, no webpack.** Same approach
as [ttf-tech.github.io](https://github.com/tesshsu/ttf-tech.github.io):

- [Tailwind CSS](https://tailwindcss.com) via CDN (utility classes for layout)
- Custom CSS in `assets/css/style.css` for anything Tailwind doesn't cover
- [Font Awesome](https://fontawesome.com) via CDN for icons
- [Firebase Realtime Database](https://firebase.google.com/products/realtime-database) (compat SDK via CDN) for the live calendar — **its own project**, separate from any other site
- [Formspree](https://formspree.io) for the booking form (already wired to your form: `https://formspree.io/f/xykrdgpa`)

## Setup you still need to do

### 1. Add your real photos (5 min)

Open `assets/js/photos-data.js` — it lists the expected filenames grouped
by room (kitchenette, chambre, salle de bain, etc.), matching your Airbnb
photo categories. Drop matching image files into `assets/photos/`. Until
a file exists, the gallery shows a "Photo à venir" placeholder tile
instead of a broken image — nothing breaks if you add photos gradually.
You can rename, add, or remove entries in that file freely.

### 2. Set your real price & minimum stay (1 min)

Open `assets/js/booking.js` — the very first constants:

```js
const BR_PRICE_PER_NIGHT = 65;   // TODO replace with your real rate
const BR_MIN_NIGHTS      = 2;    // minimum stay in nights
const BR_MAX_GUESTS      = 2;    // 1 adult, or 1 adult + 1 child
```

Everything on the page (pricing card, price summary, guest count
dropdown) reads from these three values — edit them once, the whole
page updates.

### 3. Create your Firebase project for the live calendar (~10 min)

This keeps the rental business on its own database, separate from any
community/association project.

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → name it e.g. `bellevue-rental` → Analytics optional (can disable) → Create.
2. **Build → Realtime Database → Create Database** → pick a region close to you (e.g. `europe-west1`) → start in **locked mode**.
3. Go to the **Rules** tab and paste:
   ```json
   {
     "rules": {
       "bookedRanges": {
         ".read": true,
         ".write": "auth != null && auth.token.email == 'tess.hsu@gmail.com'"
       }
     }
   }
   ```
   → **Publish**. This lets anyone view the calendar, but only your
   Google account can add/remove booked dates.
4. **Project settings** (gear icon) → **General** → scroll to "Your apps"
   → click the web icon `</>` → register an app (nickname:
   `bellevue-rental-web`) → copy the `firebaseConfig` values it shows you.
5. Paste those values into `assets/js/firebase-config.js`, replacing the
   `TODO_REPLACE...` placeholders in `BR_FB_CONFIG`.
6. Still in **Project settings → Authentication** → **Sign-in method** →
   enable **Google**.

Until you do this, the site still works for guests — the calendar just
shows every date as available (no booked ranges to read yet).

### 4. Using the admin page day-to-day

Once step 3 is done, visit `admin.html`, sign in with your Google
account (`tess.hsu@gmail.com`), and after you confirm a guest by email,
add their stay: check-in date, check-out date, and an optional note
(guest name). **Check-out is exclusive** — for a stay from the 10th to
the 14th, enter check-in `10` and check-out `14` (the night of the 13th
is the last occupied night). The public calendar on `index.html` updates
instantly for every visitor.

## Publishing to GitHub Pages

This repo is already connected to `git@github.com:tesshsu/bellevue-rental.git`
on branch `main`. To publish:

```bash
git add .
git commit -m "Initial booking site"
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source → Deploy from branch → main
/ (root)**. The site will be live at
`https://tesshsu.github.io/bellevue-rental/` within a minute or two.

## Local development

```bash
cd bellevue-rental
python3 -m http.server 8080
# open http://localhost:8080
```
