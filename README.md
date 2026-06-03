# avatalk

A notion-style avatar with a special **animated mouth** that simulates voice —
built for talking user interfaces (e.g. a circle in the bottom-right corner).

## Pages

- **`/maker` — Avatar Maker.** Compose a [notion-avatar](https://github.com/Mayandev/notion-avatar)-style
  character by cycling each part (face, hair, eyes, eyebrows, nose, glasses,
  beard, accessories, details, mouth). Parts are layered, full-canvas SVGs in
  `public/avatar/`; the selection persists in `localStorage`.
- **`/mouth` — Phoneme Mouth.** A black & white CSS lip-sync mouth — a fork of
  [LipSync.js](https://github.com/yashrajbharti/LipSync.js) recolored to
  monochrome. Each phoneme group is a `border-radius`/size shape with tongue and
  teeth layers; switching shapes animates the transition. Drive it from the
  phoneme picker or by typing text.
- **`/talk` — Talk (ElevenLabs).** Synthesizes speech via ElevenLabs, then
  drives the avatar's mouth from a live FFT analyser
  ([wawa-lipsync](https://github.com/wass08/wawa-lipsync)) that maps audio to
  visemes each animation frame. Includes a **Play sample** button (bundled clip,
  no credits needed) and a **Test mic** mode.

## Lip-sync model

`components/mouth/lipsync.ts` is the shared model: the 12 LipSync.js phoneme
groups plus a neutral `rest`, with mappings from graphemes/text, Azure viseme
IDs ([aka.ms/viseme-doc](https://aka.ms/viseme-doc)), and wawa-lipsync's Oculus
visemes onto those shapes.

## Setup

```bash
bun install
cp .env.example .env.local   # add your ELEVENLABS_API_KEY
bun dev
```

`ELEVENLABS_API_KEY` is only needed for `/talk`'s "Speak" button. The avatar
maker, phoneme mouth, "Play sample", and "Test mic" all work without it.

## Avatar parts

SVG parts are downloaded and normalized (to a shared 1080×1080 canvas) by:

```bash
node scripts/fetch-parts.mjs
```
