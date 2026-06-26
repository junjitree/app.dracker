// Derive a category (icon + accent hue) from a tag's name/desc.
// Visual-only: no backend field. Lets the dashboard read at a glance while
// staying object-agnostic — Dracker tags anything, not just pets.

export interface Category {
  icon: string;
  hue: number; // HSL hue for the icon tint
  label: string;
}

const RULES: { match: RegExp; icon: string; hue: number; label: string }[] = [
  { match: /\b(key|keys|keychain)\b/i, icon: 'vpn_key', hue: 38, label: 'Keys' },
  { match: /\b(bag|backpack|purse|tote|handbag)\b/i, icon: 'backpack', hue: 265, label: 'Bag' },
  { match: /\b(wallet|cardholder)\b/i, icon: 'account_balance_wallet', hue: 152, label: 'Wallet' },
  {
    match: /\b(luggage|suitcase|travel|carry.?on)\b/i,
    icon: 'luggage',
    hue: 200,
    label: 'Luggage',
  },
  { match: /\b(bike|bicycle|cycle)\b/i, icon: 'pedal_bike', hue: 12, label: 'Bike' },
  {
    match: /\b(car|vehicle|scooter|moto|motorbike)\b/i,
    icon: 'directions_car',
    hue: 222,
    label: 'Vehicle',
  },
  { match: /\b(dog|cat|pet|collar|puppy|kitten)\b/i, icon: 'pets', hue: 28, label: 'Pet' },
  { match: /\b(phone|mobile|cell)\b/i, icon: 'smartphone', hue: 188, label: 'Phone' },
  { match: /\b(laptop|notebook|macbook)\b/i, icon: 'laptop_mac', hue: 210, label: 'Laptop' },
  { match: /\b(camera|gopro|dslr)\b/i, icon: 'photo_camera', hue: 320, label: 'Camera' },
  { match: /\b(headphone|earbud|airpod|speaker)\b/i, icon: 'headphones', hue: 280, label: 'Audio' },
  { match: /\b(tool|drill|kit|gear|equipment)\b/i, icon: 'handyman', hue: 45, label: 'Gear' },
  { match: /\b(passport|document|id)\b/i, icon: 'badge', hue: 175, label: 'Documents' },
];

const DEFAULT: Category = { icon: 'sell', hue: 230, label: 'Tag' };

export function categoryFor(name?: string, desc?: string): Category {
  const haystack = `${name ?? ''} ${desc ?? ''}`;
  for (const rule of RULES) {
    if (rule.match.test(haystack)) {
      return { icon: rule.icon, hue: rule.hue, label: rule.label };
    }
  }
  return DEFAULT;
}
