# lipzink

[lipz.ink](https://lipz.ink) · [GitHub](https://github.com/sugarcoat-ai/lipzink)

A **voice-agnostic lip-sync mouth** and a notion-style **talking avatar**,
shipped as independent npm packages. Drop the mouth onto your own illustration,
or use the whole avatar — then feed either one any audio you like (the library
never does text-to-speech itself).

```
packages/
  mouth/    → @lipzink/mouth   — the CSS lip-sync mouth + the audio→shape seam (no assets, no TTS)
  avatar/   → @lipzink/avatar  — notion-style avatar with the mouth built in (bundles its own art)
apps/
  demo/     → the Next.js playground that dogfoods both (and shows how to wire ElevenLabs)
```

Published on npm as [@lipzink/mouth](https://www.npmjs.com/package/@lipzink/mouth) and
[@lipzink/avatar](https://www.npmjs.com/package/@lipzink/avatar).

This is a [bun](https://bun.sh) workspace monorepo.

## `@lipzink/mouth` — the mouth, on anything

The mouth is pure presentation plus a small, **observable** audio seam. Nothing
about voices or avatars is baked in — you bring the audio.

```tsx
import { TalkingMouth } from "@lipzink/mouth"
import "@lipzink/mouth/styles.css"

// Drop it over YOUR illustration — no avatar required:
function MyCharacter({ audioUrl }: { audioUrl: string }) {
  return (
    <div style={{ position: "relative" }}>
      <img src="/my-character.png" alt="" />
      <div style={{ position: "absolute", left: "50%", top: "62%", transform: "translate(-50%,-50%)" }}>
        <TalkingMouth audio={audioUrl} scale={1.4} />
      </div>
    </div>
  )
}
```

### The audio → mouth seam

`useLipsync()` is the headless core. It exposes the analysed `{ shape, amplitude,
status }` so you can render however you like, and lets you swap the detector:

```tsx
import { useLipsync, Mouth } from "@lipzink/mouth"

const ls = useLipsync()          // default analyser = wawa-lipsync; pass your own via { analyser }
ls.connect(audioElementOrUrl)    // or ls.connectMic() / ls.stop()
<Mouth shape={ls.shape} />       // or build your own visuals from ls.shape / ls.amplitude
```

Already have **viseme events** from your TTS (e.g. Azure)? Skip audio analysis
entirely and map them to shapes yourself:

```tsx
import { Mouth, azureVisemeToShape } from "@lipzink/mouth"
<Mouth shape={azureVisemeToShape(ev.visemeId)} />
```

`lipsync.ts` is the shared model: the 12 [LipSync.js](https://github.com/yashrajbharti/LipSync.js)
phoneme groups plus a neutral `rest`, with mappings from graphemes/text, Azure
viseme IDs ([aka.ms/viseme-doc](https://aka.ms/viseme-doc)), and
[wawa-lipsync](https://github.com/wass08/wawa-lipsync)'s Oculus visemes. The
mouth itself is a black & white fork of LipSync.js — a pure-CSS shape that morphs
between phoneme groups.

## `@lipzink/avatar` — the whole character

```tsx
import { useRef } from "react"
import { Avatar, type AvatarVoiceHandle } from "@lipzink/avatar"
import "@lipzink/avatar/styles.css"
import "@lipzink/mouth/styles.css"

const spec = { /* the JSON the maker exports */ }

function Bubble() {
  const voice = useRef<AvatarVoiceHandle>(null)
  return (
    <button onClick={() => voice.current?.playAudio("/hello.mp3")}>
      <Avatar spec={spec} ref={voice} size={96} />
    </button>
  )
}
```

The avatar **bundles its own SVG art** (inlined as data URLs), so it renders on
install with no asset copying. The voice handle is voice-agnostic:

- `playAudio(urlOrElement)` — drive the mouth from **any** audio you supply.
- `startMic()` — drive the mouth from the live microphone.
- `stop()` — stop and close the mouth.

`onStatusChange` reports `idle | speaking | listening | error`.

## Connecting TTS (it lives in *your* app, not the library)

Because the library never synthesizes speech, you wire up TTS yourself. The demo
shows the canonical pattern — a server route keeps the key safe, the client pipes
the audio into the voice handle (`apps/demo/app/api/tts/route.ts` +
`apps/demo/app/page.tsx`):

```tsx
const res = await fetch("/api/tts", { method: "POST", body: JSON.stringify({ text }) })
const audio = new Audio(URL.createObjectURL(await res.blob()))
voice.current?.playAudio(audio)   // the mouth follows the audio
```

## Develop

```bash
bun install
bun dev          # runs the demo (apps/demo) — consumes the packages from source

bun run build        # build both packages (tsup → dist, ESM + types + css)
bun run typecheck    # typecheck every workspace
```

`apps/demo` needs `ELEVENLABS_API_KEY` only for its **Speak** button
(`cp apps/demo/.env.example apps/demo/.env.local`). **Play sample** and
**Test mic** work without it.

## Avatar parts

The notion-avatar SVGs (Mayandev/notion-avatar) live in
`packages/avatar/src/parts` and are inlined into `parts.generated.ts`:

```bash
bun run fetch:parts      # (re)download + normalize the SVGs
bun run generate:parts   # inline them into parts.generated.ts as data URLs
```
