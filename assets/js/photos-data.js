/* ── STUDIO_PHOTOS ─────────────────────────────────────────────────
   Manifest of gallery photos, grouped by category. Each entry's
   `file` must match a real filename in assets/photos/ — if a file is
   missing, the gallery shows a "Photo à venir" placeholder instead
   of a broken image.

   To add/remove/reorder photos, or add more real files, just edit
   this array — nothing else needs to change.
*/
'use strict';

const STUDIO_PHOTOS = [
  { category: 'Extérieur & Piscine · Outdoor & Pool', file: 'assets/photos/piscine.avif', alt: 'Vue de la villa et de la piscine · Villa and pool view' },
  { category: 'Extérieur & Piscine · Outdoor & Pool', file: 'assets/photos/garden.avif', alt: 'Piscine et jardin vus d’en haut · Pool and garden from above' },
  { category: 'Extérieur & Piscine · Outdoor & Pool', file: 'assets/photos/outside2.webp', alt: 'Hamac et piscine · Hammock and pool' },
  { category: 'Extérieur & Piscine · Outdoor & Pool', file: 'assets/photos/patio.jpg', alt: 'Terrasse privée avec coin repas · Private terrace with dining area' },
  { category: 'Extérieur & Piscine · Outdoor & Pool', file: 'assets/photos/door.avif', alt: 'Portail d’entrée du domaine · Property entrance gate' },
  { category: 'Extérieur & Piscine · Outdoor & Pool', file: 'assets/photos/outsied.avif', alt: 'Cour et accès au studio · Courtyard and studio entrance' },
  { category: 'Extérieur & Piscine · Outdoor & Pool', file: 'assets/photos/parking.jpeg', alt: 'Parking couvert gratuit · Free covered parking' },

  { category: 'Chambre · Bedroom', file: 'assets/photos/chambre2.jpg', alt: 'Chambre avec lit confortable · Bedroom with comfortable bed' },
  { category: 'Chambre · Bedroom', file: 'assets/photos/chambre.jpg', alt: 'Coin bureau dans la chambre · Desk corner in the bedroom' },
  { category: 'Chambre · Bedroom', file: 'assets/photos/chambre3.avif', alt: 'Chambre, vue côté salon · Bedroom, sofa-side view' },

  { category: 'Kitchenette', file: 'assets/photos/cusine1.jpg', alt: 'Kitchenette équipée · Equipped kitchenette' },
  { category: 'Kitchenette', file: 'assets/photos/doorside.jpg', alt: 'Couloir et accès à la kitchenette · Hallway and kitchenette entrance' },

  { category: 'Salle de bain · Bathroom', file: 'assets/photos/salonDeBain.avif', alt: 'Salle de bain avec lavabo · Bathroom with sink' },
  { category: 'Salle de bain · Bathroom', file: 'assets/photos/saleDeBain2.avif', alt: 'Salle de bain avec douche et toilettes · Bathroom with shower and toilet' },
  { category: 'Salle de bain · Bathroom', file: 'assets/photos/couloir.jpg', alt: 'Couloir et accès à la salle de bain · Hallway and bathroom entrance' },

  { category: 'Espace laverie · Laundry', file: 'assets/photos/cuisine2.jpg', alt: 'Coin laverie avec évier et lave-linge · Laundry corner with sink and washing machine' }
];
