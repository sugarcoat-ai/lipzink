// Downloads notion-avatar SVG parts for compositing the avatar.
//
// IMPORTANT: we use the `preview/` folder, not `part/`. The `part/` SVGs are
// the small picker thumbnails (tight, inconsistent viewBoxes). The `preview/`
// SVGs are authored on the full 1080x1080 canvas with the correct internal
// transforms, so they composite by simple layering with NO normalization — this
// is exactly what the notion-avatar app overlays. Files are named `<index>.svg`.
//
// Some indices are empty placeholders (e.g. hair/0 = "no hair") — we skip them;
// an empty selection is represented as `null` in the app. A few newer parts use
// a mask-based filled style that doesn't match the line-art set — skipped too.
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE =
  "https://raw.githubusercontent.com/Mayandev/notion-avatar/main/public/avatar/preview";
// SVGs are the source of truth for @avatalk/avatar; after fetching, run
// `bun run generate:parts` to re-inline them into parts.generated.ts.
const OUT = new URL("../packages/avatar/src/parts", import.meta.url).pathname;

// Max source indices to probe per category (we skip gaps / 404s).
const CATEGORIES = {
  face: 20,
  hair: 60,
  eyes: 16,
  eyebrows: 16,
  nose: 16,
  glasses: 16,
  beard: 18,
  accessories: 16,
  details: 16,
  mouth: 20,
};

function isEmpty(svg) {
  // No drawable elements -> the "none" placeholder.
  return !/<(path|circle|ellipse|rect|polygon|polyline|line)\b/i.test(svg);
}

function isIncompatible(svg) {
  // Newer mask-based filled silhouettes don't match the line-art set.
  return /<mask/i.test(svg);
}

async function fetchSvg(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}

const counts = {};

for (const [cat, probe] of Object.entries(CATEGORIES)) {
  await rm(join(OUT, cat), { recursive: true, force: true });
  await mkdir(join(OUT, cat), { recursive: true });
  let saved = 0;
  for (let i = 0; i < probe; i++) {
    const raw = await fetchSvg(`${BASE}/${cat}/${i}.svg`);
    if (!raw) continue;
    if (isEmpty(raw) || isIncompatible(raw)) continue;
    // Preview SVGs are full-canvas and composition-ready; their paths only set
    // `stroke` and inherit fill. notion-avatar renders them inside an
    // `<svg fill="none">`, so add fill="none" to the root to get line-art
    // (filled parts set their own `fill` explicitly and are unaffected).
    const svg = raw.replace(/<svg(?![^>]*\bfill=)/, '<svg fill="none"');
    await writeFile(join(OUT, cat, `${saved}.svg`), svg, "utf8");
    saved++;
  }
  counts[cat] = saved;
  console.log(`${cat}: ${saved} parts`);
}

await writeFile(
  join(OUT, "manifest.json"),
  JSON.stringify(counts, null, 2),
  "utf8",
);
console.log("done", counts);
