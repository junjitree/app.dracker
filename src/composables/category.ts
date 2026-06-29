// Derive a category (icon + accent color) from a tag's name/desc.
// Visual-only: no backend field. Lets the dashboard read at a glance while
// staying object-agnostic — Dracker tags anything, not just pets.
//
// Colors are drawn from the shared QR accent palette so a tag's card tint
// belongs to the same world as the QR it prints. See palette.ts.

import { TOKYO_ACCENTS } from './palette';

export interface Category {
  icon: string;
  color: string; // QR accent hex for the icon tint
  label: string;
}

const RULES: { match: RegExp; icon: string; color: string; label: string }[] = [
  { match: /\b(key|keys|keychain)\b/i, icon: 'vpn_key', color: TOKYO_ACCENTS.yellow, label: 'Keys' },
  {
    match: /\b(bag|backpack|purse|tote|handbag)\b/i,
    icon: 'backpack',
    color: TOKYO_ACCENTS.purple,
    label: 'Bag',
  },
  {
    match: /\b(wallet|cardholder)\b/i,
    icon: 'account_balance_wallet',
    color: TOKYO_ACCENTS.green,
    label: 'Wallet',
  },
  {
    match: /\b(luggage|suitcase|travel|carry.?on)\b/i,
    icon: 'luggage',
    color: TOKYO_ACCENTS.blue,
    label: 'Luggage',
  },
  { match: /\b(bike|bicycle|cycle)\b/i, icon: 'pedal_bike', color: TOKYO_ACCENTS.orange, label: 'Bike' },
  {
    match: /\b(car|vehicle|scooter|moto|motorbike)\b/i,
    icon: 'directions_car',
    color: TOKYO_ACCENTS.blue,
    label: 'Vehicle',
  },
  { match: /\b(dog|cat|pet|collar|puppy|kitten)\b/i, icon: 'pets', color: TOKYO_ACCENTS.orange, label: 'Pet' },
  { match: /\b(phone|mobile|cell)\b/i, icon: 'smartphone', color: TOKYO_ACCENTS.cyan, label: 'Phone' },
  { match: /\b(laptop|notebook|macbook)\b/i, icon: 'laptop_mac', color: TOKYO_ACCENTS.blue, label: 'Laptop' },
  { match: /\b(camera|gopro|dslr)\b/i, icon: 'photo_camera', color: TOKYO_ACCENTS.red, label: 'Camera' },
  {
    match: /\b(headphone|earbud|airpod|speaker)\b/i,
    icon: 'headphones',
    color: TOKYO_ACCENTS.purple,
    label: 'Audio',
  },
  { match: /\b(tool|drill|kit|gear|equipment)\b/i, icon: 'handyman', color: TOKYO_ACCENTS.yellow, label: 'Gear' },
  { match: /\b(passport|document|id)\b/i, icon: 'badge', color: TOKYO_ACCENTS.teal, label: 'Documents' },
];

const DEFAULT: Category = { icon: 'sell', color: TOKYO_ACCENTS.blue, label: 'Tag' };

export function categoryFor(name?: string, desc?: string): Category {
  const haystack = `${name ?? ''} ${desc ?? ''}`;
  for (const rule of RULES) {
    if (rule.match.test(haystack)) {
      return { icon: rule.icon, color: rule.color, label: rule.label };
    }
  }
  return DEFAULT;
}
