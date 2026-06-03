// Shared model for the notion-style avatar. Parts are normalized full-canvas
// (1080x1080) line-art SVGs in /public/avatar/<category>/<index>.svg, so they
// stack and align by simply layering them at the same size.

export const AVATAR_CATEGORIES = [
  "face",
  "hair",
  "eyes",
  "eyebrows",
  "nose",
  "glasses",
  "beard",
  "accessories",
  "details",
  "mouth",
] as const;

export type AvatarCategory = (typeof AVATAR_CATEGORIES)[number];

// Number of downloaded variants per category (see scripts/fetch-parts.mjs).
export const PART_COUNTS: Record<AvatarCategory, number> = {
  face: 16,
  hair: 58,
  eyes: 14,
  eyebrows: 16,
  nose: 14,
  glasses: 12,
  beard: 16,
  accessories: 14,
  details: 13,
  mouth: 20,
};

// Categories that can be empty (the "none" option).
export const OPTIONAL_CATEGORIES: AvatarCategory[] = [
  "hair",
  "glasses",
  "beard",
  "accessories",
  "details",
];

// Bottom-to-top stacking order. Mouth sits above the beard so a talking mouth
// stays visible; hair/glasses/details sit on top of the face.
export const LAYER_ORDER: AvatarCategory[] = [
  "face",
  "beard",
  "nose",
  "mouth",
  "eyes",
  "eyebrows",
  "glasses",
  "hair",
  "details",
  "accessories",
];

// `null` means the part is omitted (only valid for OPTIONAL_CATEGORIES).
export type AvatarConfig = Record<AvatarCategory, number | null>;

export const DEFAULT_AVATAR: AvatarConfig = {
  face: 0,
  hair: 0,
  eyes: 0,
  eyebrows: 0,
  nose: 0,
  glasses: null,
  beard: null,
  accessories: null,
  details: null,
  mouth: 0,
};

export function partSrc(category: AvatarCategory, index: number): string {
  return `/avatar/${category}/${index}.svg`;
}

/**
 * Cycle a category's selection forward. Optional categories include a `null`
 * ("none") slot at the start of the cycle.
 */
export function cyclePart(
  config: AvatarConfig,
  category: AvatarCategory,
  direction: 1 | -1 = 1,
): AvatarConfig {
  const count = PART_COUNTS[category];
  const optional = OPTIONAL_CATEGORIES.includes(category);
  // Build the ordered list of slots: [null?, 0, 1, ... count-1]
  const slots: (number | null)[] = optional ? [null] : [];
  for (let i = 0; i < count; i++) slots.push(i);

  const current = config[category];
  const idx = slots.findIndex((s) => s === current);
  const next = slots[(idx + direction + slots.length) % slots.length];
  return { ...config, [category]: next };
}

export function randomAvatar(): AvatarConfig {
  const config = {} as AvatarConfig;
  for (const cat of AVATAR_CATEGORIES) {
    const optional = OPTIONAL_CATEGORIES.includes(cat);
    // Optional parts are present ~60% of the time.
    if (optional && Math.random() < 0.4) {
      config[cat] = null;
    } else {
      config[cat] = Math.floor(Math.random() * PART_COUNTS[cat]);
    }
  }
  return config;
}

// The canonical mouth region on the 1080 canvas (derived from notion mouth
// parts): horizontally centered, sitting in the lower third of the face.
export const MOUTH_CENTER = { x: 620, y: 770 } as const;

// The notion-avatar parts are not centered within the 1080 canvas: measured
// across all parts, the content bounding box centers near (429, 447) and spans
// ~908x944. AVATAR_FRAME recenters on that point (as canvas fractions) and
// scales the whole composition down so wide/low parts (glasses, beard, hair)
// stay fully inside the circular frame.
export const AVATAR_FRAME = { cx: 0.47, cy: 0.5, scale: 0.9 } as const;
