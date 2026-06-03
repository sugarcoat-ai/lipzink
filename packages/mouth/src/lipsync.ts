// Lip-sync model — a fork of LipSync.js (yashrajbharti/LipSync.js), which drives
// a pure-CSS mouth by switching a `data-letters` attribute between phoneme
// groups and letting `border-radius` / size transitions morph the shape.
//
// We keep its 12 phoneme groups (plus an explicit neutral "rest"), and add
// mappings from graphemes, text, and Azure viseme IDs so the same mouth can be
// driven by typed text, speech-to-text, or TTS viseme events.

export type LipShape =
  | "rest" // neutral, lips gently closed
  | "aei" // open jaw (a, i, ay)
  | "bmp" // lips pressed shut (b, m, p)
  | "cdgknstxyz" // small neutral open (consonants)
  | "chjsh" // rounded-forward (ch, j, sh)
  | "ee" // wide stretched (e)
  | "fv" // top teeth on lower lip (f, v)
  | "l" // tongue tip raised (l)
  | "o" // tall rounded (o)
  | "qw" // pucker (q, w)
  | "r" // slightly rounded (r)
  | "th" // tongue between teeth (th)
  | "u"; // rounded narrow (u)

export const LIP_SHAPES: LipShape[] = [
  "rest",
  "aei",
  "ee",
  "o",
  "u",
  "qw",
  "bmp",
  "fv",
  "l",
  "th",
  "r",
  "chjsh",
  "cdgknstxyz",
];

export const LIP_SHAPE_LABELS: Record<LipShape, string> = {
  rest: "Rest",
  aei: "A / I (ah)",
  ee: "E (ee)",
  o: "O (oh)",
  u: "U (oo)",
  qw: "Q / W",
  bmp: "B / M / P",
  fv: "F / V",
  l: "L",
  th: "Th",
  r: "R",
  chjsh: "Ch / J / Sh",
  cdgknstxyz: "C/D/G/K/N/S/T…",
};

// --- Grapheme -> shape ---------------------------------------------------
const CHAR_SHAPE: Record<string, LipShape> = {
  a: "aei", i: "aei", y: "aei",
  e: "ee",
  o: "o",
  u: "u", w: "qw", q: "qw",
  b: "bmp", m: "bmp", p: "bmp",
  f: "fv", v: "fv",
  l: "l",
  r: "r",
  h: "aei",
  j: "chjsh",
  c: "cdgknstxyz", d: "cdgknstxyz", g: "cdgknstxyz", k: "cdgknstxyz",
  n: "cdgknstxyz", s: "cdgknstxyz", t: "cdgknstxyz", x: "cdgknstxyz", z: "cdgknstxyz",
};

export function charToShape(char: string): LipShape {
  return CHAR_SHAPE[char.toLowerCase()] ?? "rest";
}

/**
 * Convert a string into an ordered list of mouth shapes, roughly one per spoken
 * sound. Repeated/duplicate shapes are collapsed, and word breaks insert a
 * brief "rest" closure. The caller supplies the per-shape timing.
 */
export function textToShapes(text: string): LipShape[] {
  const shapes: LipShape[] = [];
  let prev: LipShape | null = null;
  for (const ch of text) {
    let shape: LipShape;
    if (/[a-z]/i.test(ch)) {
      shape = charToShape(ch);
    } else {
      shape = "rest"; // space / punctuation -> close briefly
    }
    if (shape !== prev) {
      shapes.push(shape);
      prev = shape;
    }
  }
  if (shapes[shapes.length - 1] !== "rest") shapes.push("rest");
  return shapes;
}

// --- Azure viseme ID (0-21) -> shape -------------------------------------
// https://aka.ms/viseme-doc — lets TTS viseme events drive the same mouth.
export const AZURE_VISEME_TO_SHAPE: Record<number, LipShape> = {
  0: "rest", // silence
  1: "aei", // æ ə ʌ
  2: "aei", // ɑ
  3: "o", // ɔ
  4: "ee", // ɛ ʊ
  5: "r", // ɝ
  6: "ee", // j i ɪ
  7: "u", // w u
  8: "o", // o
  9: "aei", // aʊ
  10: "o", // ɔɪ
  11: "aei", // aɪ
  12: "aei", // h
  13: "r", // ɹ
  14: "l", // l
  15: "cdgknstxyz", // s z
  16: "chjsh", // ʃ tʃ dʒ ʒ
  17: "th", // ð
  18: "fv", // f v
  19: "cdgknstxyz", // d t n θ
  20: "cdgknstxyz", // k g ŋ
  21: "bmp", // p b m
};

export function azureVisemeToShape(id: number): LipShape {
  return AZURE_VISEME_TO_SHAPE[id] ?? "rest";
}

// --- wawa-lipsync (Oculus) viseme -> shape -------------------------------
// wawa-lipsync analyses live audio and reports an Oculus/Reallusion viseme
// (e.g. "viseme_aa"). We map those onto our 12 LipSync.js phoneme groups.
export const WAWA_VISEME_TO_SHAPE: Record<string, LipShape> = {
  viseme_sil: "rest",
  viseme_PP: "bmp", // p, b, m
  viseme_FF: "fv", // f, v
  viseme_TH: "th", // th
  viseme_DD: "cdgknstxyz", // d, t
  viseme_kk: "cdgknstxyz", // k, g
  viseme_CH: "chjsh", // ch, j, sh
  viseme_SS: "cdgknstxyz", // s, z
  viseme_nn: "cdgknstxyz", // n, l
  viseme_RR: "r", // r
  viseme_aa: "aei", // ah
  viseme_E: "ee", // eh
  viseme_I: "ee", // ih
  viseme_O: "o", // oh
  viseme_U: "u", // oo
}

export function wawaVisemeToShape(viseme: string): LipShape {
  return WAWA_VISEME_TO_SHAPE[viseme] ?? "rest"
}

// --- Audio amplitude / brightness -> shape -------------------------------
// When we only have raw audio (no viseme events), pick a plausible vowel-ish
// shape from loudness + spectral brightness so the mouth still feels alive.
export function audioToShape(amplitude: number, brightness: number): LipShape {
  if (amplitude < 0.06) return "rest";
  if (amplitude < 0.16) return brightness > 0.5 ? "cdgknstxyz" : "bmp";
  // Louder: choose an open vowel by brightness (dark -> rounded, bright -> wide)
  if (brightness < 0.3) return "o";
  if (brightness < 0.5) return "aei";
  return "ee";
}
