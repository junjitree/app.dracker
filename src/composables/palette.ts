// Shared Dracker palette — single source of truth for the QR artifact AND the
// app chrome, so the interface wears the same colors as the tags it prints.
//
// The QR design is a *light* composition: soft Tokyo Night accents blended as a
// 4-corner mesh over white, with dark "ink" reserved for the QR dots/ring. The
// app leans on the same light accents.

/** Soft accent hues — the mesh corners on the QR and the app's category/decor colors. */
export const TOKYO_ACCENTS = {
  blue: '#7aa2f7',
  cyan: '#7dcfff',
  purple: '#bb9af7',
  red: '#f7768e',
  green: '#9ece6a',
  orange: '#ff9e64',
  yellow: '#e0af68',
  teal: '#2ac3de',
} as const;

export type AccentName = keyof typeof TOKYO_ACCENTS;

/** Accent palette as an ordered array (used to seed the QR mesh). */
export const ACCENT_LIST: string[] = Object.values(TOKYO_ACCENTS);

/** Dark "ink" palette — QR dots + ring; must stay high-contrast over the mesh. */
export const TOKYO_INK: string[] = [
  '#1a365d', // navy
  '#24283b', // tokyo storm
  '#3d59a1', // tokyo dark blue
  '#16161e', // tokyo deep
  '#414868', // tokyo grey-blue
  '#532b88', // deep purple
  '#7a1f4d', // deep magenta
  '#1b4332', // deep green
];

/** The four mesh anchor points (fractions of the square), shared by QR + app. */
export const MESH_CORNERS = [
  { x: 0.15, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.85 },
  { x: 0.15, y: 0.85 },
] as const;

/**
 * Build the QR-style mesh as a CSS `background` value: four radial accent spots
 * blending into a base color. `fade` is where each spot dissolves to transparent.
 */
export function meshGradient(colors: string[], base = '#ffffff', fade = 60): string {
  const spots = MESH_CORNERS.map(
    (c, i) =>
      `radial-gradient(circle at ${c.x * 100}% ${c.y * 100}%, ${colors[i % colors.length]}, transparent ${fade}%)`,
  );
  return [...spots, base].join(', ');
}

/** A shuffled set of four accents, for the QR's randomize-colors control. */
export function pickAccents(): string[] {
  const pool = [...ACCENT_LIST].sort(() => Math.random() - 0.5);
  return MESH_CORNERS.map((_, i) => pool[i % pool.length] as string);
}

/** A random ink tone for QR dots/ring. */
export function pickInk(): string {
  return TOKYO_INK[Math.floor(Math.random() * TOKYO_INK.length)] as string;
}
