// Inlines the notion-avatar SVG parts into a TypeScript module as data URLs, so
// `@avatalk/avatar` bundles its own art and works on install with zero asset
// setup — no /public copy, no partsBaseUrl. The SVGs in src/parts are the
// source of truth; this regenerates src/parts.generated.ts from them.
//
// It also computes a per-part "frame" (centre + zoom) from the geometry's
// bounding box, so a part picker can zoom each thumbnail right onto its shape.
//
// Run: `node scripts/generate-parts.mjs` (or `bun run generate:parts`).
import { readdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const PARTS_DIR = new URL("../packages/avatar/src/parts", import.meta.url)
  .pathname
const OUT = new URL("../packages/avatar/src/parts.generated.ts", import.meta.url)
  .pathname

const CANVAS = 1080
// Thumbnail framing: leave a little padding around the part, and don't blow
// tiny parts up past this (strokes would get comically thick).
const PAD = 0.82
const MAX_ZOOM = 6
const MIN_ZOOM = 0.5
// Fallback frame (≈ the whole-composition frame) for parts we can't measure.
const DEFAULT_FRAME = { cx: 0.47, cy: 0.5, scale: 0.9 }

// Stacking-relevant categories (see avatar-model.ts AVATAR_CATEGORIES).
const CATEGORIES = [
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
]

/** Compact, img-src-safe data URL for an SVG string. */
function toDataUrl(svg) {
  // Collapse whitespace, then percent-encode. utf8 data URLs are smaller than
  // base64 and render fine in <img src>.
  const min = svg.replace(/\s+/g, " ").trim()
  return `data:image/svg+xml,${encodeURIComponent(min)}`
}

// --- 2x3 affine matrices: x' = a*x + c*y + e ; y' = b*x + d*y + f ----------
const ID = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
function mul(m, n) {
  return {
    a: m.a * n.a + m.c * n.b,
    b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d,
    d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e,
    f: m.b * n.e + m.d * n.f + m.f,
  }
}
function apply(m, x, y) {
  return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]
}
function nums(s) {
  return (s.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number)
}

/** Parse an SVG transform attribute into a single matrix. */
function parseTransform(str) {
  let m = ID
  const re = /(translate|scale|rotate|matrix)\s*\(([^)]*)\)/gi
  let g
  while ((g = re.exec(str))) {
    const op = g[1].toLowerCase()
    const p = nums(g[2])
    let t = ID
    if (op === "translate") t = { ...ID, e: p[0] || 0, f: p[1] || 0 }
    else if (op === "scale")
      t = { ...ID, a: p[0] ?? 1, d: p[1] ?? p[0] ?? 1 }
    else if (op === "rotate") {
      const r = ((p[0] || 0) * Math.PI) / 180
      const cos = Math.cos(r)
      const sin = Math.sin(r)
      const rot = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }
      if (p.length >= 3) {
        // rotate(angle cx cy) = T(cx,cy)·R·T(-cx,-cy)
        const cx = p[1]
        const cy = p[2]
        t = mul(mul({ ...ID, e: cx, f: cy }, rot), { ...ID, e: -cx, f: -cy })
      } else t = rot
    } else if (op === "matrix")
      t = { a: p[0], b: p[1], c: p[2], d: p[3], e: p[4], f: p[5] }
    m = mul(m, t)
  }
  return m
}

/** Pull a single attribute's raw value off a tag's attribute string. */
function attr(s, name) {
  const m = s.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"))
  return m ? m[1] : null
}

/**
 * Bounding box of a part's drawn geometry, in canvas units, with group +
 * element transforms applied. No arcs / relative commands appear in this set
 * (verified), so path coordinates are plain absolute x,y pairs; bezier control
 * points are included, which only ever over-estimates the box (safe).
 */
function boundingBox(svg) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const stack = [ID] // group transform stack
  const top = () => stack[stack.length - 1]

  const add = (m, x, y) => {
    const [px, py] = apply(m, x, y)
    if (px < minX) minX = px
    if (py < minY) minY = py
    if (px > maxX) maxX = px
    if (py > maxY) maxY = py
  }
  const addPairs = (m, arr) => {
    for (let i = 0; i + 1 < arr.length; i += 2) add(m, arr[i], arr[i + 1])
  }

  const tagRe = /<(\/?)([a-zA-Z]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g
  let g
  while ((g = tagRe.exec(svg))) {
    const closing = g[1] === "/"
    const name = g[2].toLowerCase()
    const body = g[3]
    if (closing) {
      if (name === "g" && stack.length > 1) stack.pop()
      continue
    }
    const tf = attr(body, "transform")
    const local = tf ? mul(top(), parseTransform(tf)) : top()

    if (name === "g") {
      if (g[4] !== "/") stack.push(local)
      continue
    }
    if (name === "path") addPairs(local, nums(attr(body, "d") || ""))
    else if (name === "line") {
      const n = nums(`${attr(body, "x1")} ${attr(body, "y1")}`)
      const n2 = nums(`${attr(body, "x2")} ${attr(body, "y2")}`)
      add(local, n[0], n[1])
      add(local, n2[0], n2[1])
    } else if (name === "circle") {
      const [cx, cy, r] = [
        +attr(body, "cx") || 0,
        +attr(body, "cy") || 0,
        +attr(body, "r") || 0,
      ]
      add(local, cx - r, cy - r)
      add(local, cx + r, cy + r)
    } else if (name === "ellipse") {
      const [cx, cy, rx, ry] = [
        +attr(body, "cx") || 0,
        +attr(body, "cy") || 0,
        +attr(body, "rx") || 0,
        +attr(body, "ry") || 0,
      ]
      add(local, cx - rx, cy - ry)
      add(local, cx + rx, cy + ry)
    } else if (name === "rect") {
      const [x, y, w, h] = [
        +attr(body, "x") || 0,
        +attr(body, "y") || 0,
        +attr(body, "width") || 0,
        +attr(body, "height") || 0,
      ]
      add(local, x, y)
      add(local, x + w, y + h)
    } else if (name === "polygon" || name === "polyline") {
      addPairs(local, nums(attr(body, "points") || ""))
    }
  }

  if (!isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}

/** Per-part frame: centre (as canvas fractions) + zoom to fill a thumbnail. */
function frameFor(svg) {
  const bb = boundingBox(svg)
  if (!bb) return DEFAULT_FRAME
  const w = (bb.maxX - bb.minX) / CANVAS
  const h = (bb.maxY - bb.minY) / CANVAS
  const cx = (bb.minX + bb.maxX) / 2 / CANVAS
  const cy = (bb.minY + bb.maxY) / 2 / CANVAS
  const scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, PAD / Math.max(w, h)))
  return {
    cx: +cx.toFixed(4),
    cy: +cy.toFixed(4),
    scale: +scale.toFixed(3),
  }
}

const map = {}
const frames = {}
const counts = {}

for (const cat of CATEGORIES) {
  const dir = join(PARTS_DIR, cat)
  const files = (await readdir(dir))
    .filter((f) => f.endsWith(".svg"))
    .sort((a, b) => parseInt(a) - parseInt(b))
  const urls = []
  const fr = []
  for (const f of files) {
    const svg = await readFile(join(dir, f), "utf8")
    urls.push(toDataUrl(svg))
    fr.push(frameFor(svg))
  }
  map[cat] = urls
  frames[cat] = fr
  counts[cat] = urls.length
}

const body = `// AUTO-GENERATED by scripts/generate-parts.mjs — do not edit by hand.
// notion-avatar parts (Mayandev/notion-avatar) inlined as data URLs so the
// avatar bundles its own art. Regenerate with \`bun run generate:parts\`.

import type { AvatarCategory } from "./avatar-model"

/** Per-part centre (canvas fractions) + zoom, framed to the part's bounding box. */
export type PartFrame = { cx: number; cy: number; scale: number }

export const PART_SRC: Record<AvatarCategory, string[]> = ${JSON.stringify(
  map,
  null,
  2,
)}

export const PART_FRAME: Record<AvatarCategory, PartFrame[]> = ${JSON.stringify(
  frames,
  null,
  2,
)}

export const PART_COUNTS: Record<AvatarCategory, number> = ${JSON.stringify(
  counts,
  null,
  2,
)}
`

await writeFile(OUT, body, "utf8")
console.log("generated", OUT)
console.table(counts)
