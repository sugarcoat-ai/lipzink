// Shared model for the notion-style avatar. Parts are normalized full-canvas
// (1080x1080) line-art SVGs, inlined as data URLs in parts.generated.ts, so they
// stack and align by simply layering them at the same size — and the package
// ships its own art with no /public dependency.

import { PART_COUNTS, PART_FRAME, type PartFrame, PART_SRC } from "./parts.generated"

export { PART_FRAME };
export type { PartFrame };

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

// Number of variants per category — derived from the bundled art so it can
// never drift from what actually ships (see scripts/generate-parts.mjs).
export { PART_COUNTS };

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

/** Resolve a part's image source — a bundled, inlined data URL. */
export function partSrc(category: AvatarCategory, index: number): string {
  return PART_SRC[category][index];
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

/**
 * The frame (centre + zoom) that fits a single part to its own bounding box —
 * use it to zoom a picker thumbnail right onto the shape, instead of showing
 * the whole 1080 canvas. Falls back to AVATAR_FRAME if unmeasured.
 */
export function partFrame(category: AvatarCategory, index: number): PartFrame {
  return PART_FRAME[category]?.[index] ?? AVATAR_FRAME;
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
