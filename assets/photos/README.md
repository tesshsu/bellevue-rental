# Studio photos

The 16 real photos here are already wired into the gallery via
[`../js/photos-data.js`](../js/photos-data.js), grouped by room
(exterior/pool, bedroom, kitchenette, bathroom, laundry). Any resolution
works — the gallery scales and crops them automatically, and jpg/jpeg/
webp/avif are all supported.

Until a file exists, the gallery shows a grey "Photo à venir" placeholder
instead of a broken image, so you can add photos gradually without the
site ever looking broken.

To add more photos than the current list, or rename/reorganize them,
just edit the `STUDIO_PHOTOS` array in `photos-data.js` — nothing else
needs to change.
