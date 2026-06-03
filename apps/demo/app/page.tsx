"use client"

import { useRef, useState } from "react"
import { Check, Copy, Mic, Play, Shuffle, Square, Volume2 } from "lucide-react"

import {
  Avatar,
  type AvatarCategory,
  type AvatarConfig,
  type AvatarVoiceHandle,
  randomAvatar,
} from "@avatalk/avatar"
import {
  fetchElevenLabsSpeech,
  type LipShape,
  LIP_SHAPES,
  LIP_SHAPE_LABELS,
  type LipsyncStatus,
  TalkingMouth,
  type TalkingMouthHandle,
} from "@avatalk/mouth"
import { PartCarousel } from "@/components/avatar/part-picker"
import { Button } from "@/components/ui/button"
import { setAvatarConfig, useAvatarConfig } from "@/lib/use-avatar"

// Categories split across the two flanks of the avatar (mouth is excluded —
// it's the animated talking mouth, driven by audio, not a static part).
const LEFT_PARTS: AvatarCategory[] = ["hair", "glasses", "beard", "accessories"]
const RIGHT_PARTS: AvatarCategory[] = ["face", "eyebrows", "eyes", "nose", "details"]

// ElevenLabs stock voices (only used by "Speak", which needs an API key).
const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
]

// The spec the <Avatar/> component consumes.
function specText(config: AvatarConfig): string {
  return JSON.stringify(config, null, 2)
}

/**
 * Connect ElevenLabs to the avatar. This lives in the *app*, not the library:
 * the avatar is voice-agnostic. `/api/tts` proxies ElevenLabs' `/with-timestamps`
 * endpoint; `fetchElevenLabsSpeech` decodes the audio and turns the character
 * timestamps into a scheduled cue timeline, which `playCues` drives against the
 * audio clock — so the mouth lands on each phoneme on time, not trailing it.
 */
async function speakViaElevenLabs(
  text: string,
  voiceId: string,
  voice: AvatarVoiceHandle,
): Promise<void> {
  const speech = await fetchElevenLabsSpeech("/api/tts", { text, voiceId })
  await voice.playCues(speech.audio, speech.cues)
}

const INSTALL_CMD = "npm i @avatalk/avatar @avatalk/mouth"

const AVATAR_SNIPPET = `import { useRef } from "react"
import { Avatar, type AvatarVoiceHandle } from "@avatalk/avatar"
import { fetchElevenLabsSpeech } from "@avatalk/mouth"
import "@avatalk/avatar/styles.css"
import "@avatalk/mouth/styles.css"

// Paste the spec you copied above:
const spec = { /* … */ }

function Bubble() {
  const voice = useRef<AvatarVoiceHandle>(null)
  return (
    <button onClick={async () => {
      // ElevenLabs timestamps → on-time lip-sync. /api/tts proxies the
      // \`/with-timestamps\` endpoint (keeps your key server-side):
      const speech = await fetchElevenLabsSpeech("/api/tts", { text: "Hi!", voiceId })
      voice.current?.playCues(speech.audio, speech.cues)
      // No timestamps? Reactive fallback: .playAudio(url) / .startMic() / .stop()
    }}>
      <Avatar spec={spec} ref={voice} size={96} />
    </button>
  )
}`

const MOUTH_SNIPPET = `import { TalkingMouth } from "@avatalk/mouth"
import "@avatalk/mouth/styles.css"

// Drop the mouth onto YOUR OWN illustration — no avatar required:
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

// Or go fully headless and render whatever you like:
//   const { shape, amplitude } = useLipsync()
//   ls.connect(myAudioElement)`

/** A copy-to-clipboard button that flips to a check for a moment. */
function CopyButton({
  value,
  children,
  variant = "outline",
}: {
  value: string
  children: React.ReactNode
  variant?: "outline" | "ghost" | "secondary"
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant={variant}
      onClick={() => {
        void navigator.clipboard?.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {children}
    </Button>
  )
}

export default function Page() {
  const config = useAvatarConfig()
  const [text, setText] = useState("Hi! I'm your avatar — give me something to say.")
  const [voiceId, setVoiceId] = useState(VOICES[0].id)
  const [status, setStatus] = useState<LipsyncStatus>("idle")
  const [synthesizing, setSynthesizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // When set, freezes the avatar's mouth to a chosen viseme (overrides audio).
  const [previewShape, setPreviewShape] = useState<LipShape | null>(null)

  // The avatar's imperative voice handle (the library's "pass audio" surface).
  const voice = useRef<AvatarVoiceHandle>(null)
  // The standalone mouth demo's handle (no avatar involved).
  const mouth = useRef<TalkingMouthHandle>(null)

  const busy = status === "speaking" || status === "listening" || synthesizing

  async function handleSpeak() {
    if (!voice.current) return
    setError(null)
    setPreviewShape(null)
    setSynthesizing(true)
    try {
      await speakViaElevenLabs(text, voiceId, voice.current)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSynthesizing(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-lg font-semibold tracking-tight">avatalk</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            A voice-agnostic lip-sync mouth (
            <code className="text-xs">@avatalk/mouth</code>) and a notion-style
            talking avatar (<code className="text-xs">@avatalk/avatar</code>).
            Build one, feed it any audio, and drop it into your app.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAvatarConfig(randomAvatar())}
        >
          <Shuffle className="size-4" /> Randomize
        </Button>
      </header>

      {/* Studio: carousels flank the avatar (stacks on mobile). */}
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="order-2 flex flex-col gap-5 lg:order-1">
          {LEFT_PARTS.map((cat) => (
            <PartCarousel key={cat} category={cat} config={config} align="right" />
          ))}
        </div>

        <div className="order-1 flex flex-col items-center gap-4 lg:order-2">
          <Avatar
            spec={config}
            ref={voice}
            shape={previewShape ?? undefined}
            onStatusChange={setStatus}
            size={300}
            className="shadow-sm ring-1 ring-black/5"
          />
          <div className="text-muted-foreground font-mono text-[11px]">
            {previewShape
              ? `viseme · ${LIP_SHAPE_LABELS[previewShape]}`
              : synthesizing
                ? "synthesizing…"
                : status === "idle"
                  ? "ready"
                  : status === "speaking"
                    ? "speaking…"
                    : status === "listening"
                      ? "listening…"
                      : "error"}
          </div>
        </div>

        <div className="order-3 flex flex-col gap-5">
          {RIGHT_PARTS.map((cat) => (
            <PartCarousel key={cat} category={cat} config={config} align="left" />
          ))}
        </div>
      </section>

      {/* Control bar: say something, play, and export the spec. */}
      <section className="mx-auto mt-10 max-w-3xl space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="focus-visible:ring-ring w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2"
          placeholder="Type something for the avatar to say…"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-muted-foreground text-sm">Voice</label>
          <select
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          <div className="ml-auto flex flex-wrap gap-2">
            {busy ? (
              <Button onClick={() => voice.current?.stop()} variant="secondary">
                <Square className="size-4" /> Stop
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPreviewShape(null)
                    voice.current?.playAudio("/sample-tts.mp3")
                  }}
                >
                  <Play className="size-4" /> Play sample
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewShape(null)
                    voice.current?.startMic()
                  }}
                >
                  <Mic className="size-4" /> Test mic
                </Button>
                <Button onClick={handleSpeak} disabled={synthesizing || !text.trim()}>
                  <Volume2 className="size-4" />
                  {synthesizing ? "Synthesizing…" : "Speak"}
                </Button>
              </>
            )}
            <CopyButton value={specText(config)}>Copy spec</CopyButton>
          </div>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-muted-foreground text-xs">
          “Play sample” needs no API key. “Speak” uses ElevenLabs via{" "}
          <code>/api/tts</code> — set <code>ELEVENLABS_API_KEY</code> to enable it.
        </p>
      </section>

      {/* Viseme palette: click to freeze the avatar's mouth on a shape. */}
      <section className="mx-auto mt-12 max-w-3xl border-t pt-10">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-mono text-sm font-semibold tracking-tight">
            Supported visemes
          </h2>
          {previewShape && (
            <button
              type="button"
              onClick={() => setPreviewShape(null)}
              className="text-muted-foreground hover:text-foreground font-mono text-xs"
            >
              resume live ✕
            </button>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          The {LIP_SHAPES.length} mouth shapes the lip-sync model maps every
          phoneme onto. Click one to see it on the avatar above; play audio to
          resume live lip-sync.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {LIP_SHAPES.map((s) => {
            const active = previewShape === s
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  if (active) {
                    setPreviewShape(null)
                    return
                  }
                  voice.current?.stop()
                  setPreviewShape(s)
                }}
                className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={s}
              >
                {LIP_SHAPE_LABELS[s]}
              </button>
            )
          })}
        </div>
      </section>

      {/* Standalone mouth: the lip-sync mouth on a non-avatar illustration. */}
      <StandaloneMouthDemo mouth={mouth} />

      {/* Usage docs. */}
      <section className="mx-auto mt-14 max-w-3xl border-t pt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-sm font-semibold tracking-tight">
            Use it in your app
          </h2>
          <CopyButton value={INSTALL_CMD} variant="ghost">
            {INSTALL_CMD}
          </CopyButton>
        </div>
        <ol className="text-muted-foreground mt-4 space-y-4 text-sm">
          <li>
            <span className="text-foreground font-medium">1 · Pick a layer.</span>{" "}
            Want the whole character? Use{" "}
            <code className="text-xs">&lt;Avatar spec /&gt;</code> from{" "}
            <code className="text-xs">@avatalk/avatar</code> (it bundles its own
            art). Just need the mouth on your own illustration? Use{" "}
            <code className="text-xs">@avatalk/mouth</code> — no avatar, no assets.
          </li>
          <li>
            <span className="text-foreground font-medium">2 · Feed it audio.</span>{" "}
            The library never does TTS — you bring the sound. Best results:{" "}
            <code className="text-xs">fetchElevenLabsSpeech()</code> then{" "}
            <code className="text-xs">playCues(audio, cues)</code> — ElevenLabs
            timestamps schedule the mouth so it lands on each phoneme on time. No
            timestamps? Fall back to{" "}
            <code className="text-xs">playAudio(urlOrElement)</code> (reactive
            analysis) or <code className="text-xs">startMic()</code>;{" "}
            <code className="text-xs">stop()</code> closes the mouth.{" "}
            <code className="text-xs">onStatusChange</code> reports state.
          </li>
          <li>
            <span className="text-foreground font-medium">3 · Or go headless.</span>{" "}
            <code className="text-xs">useLipsync()</code> exposes{" "}
            <code className="text-xs">{"{ shape, amplitude, status }"}</code> so you
            can build your own visuals — or swap the analyser entirely. Driving the
            mouth from TTS viseme events instead? Map them with{" "}
            <code className="text-xs">azureVisemeToShape()</code> and feed{" "}
            <code className="text-xs">&lt;Mouth shape /&gt;</code> directly.
          </li>
        </ol>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Snippet title="Whole avatar (@avatalk/avatar)" code={AVATAR_SNIPPET} />
          <Snippet title="Just the mouth (@avatalk/mouth)" code={MOUTH_SNIPPET} />
        </div>
      </section>
    </main>
  )
}

/** A labelled, copyable code block. */
function Snippet({ title, code }: { title: string; code: string }) {
  return (
    <div className="relative">
      <div className="text-muted-foreground mb-1.5 font-mono text-[11px]">
        {title}
      </div>
      <pre className="bg-muted/50 overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-relaxed">
        {code}
      </pre>
      <div className="absolute right-2 top-7">
        <CopyButton value={code} variant="secondary">
          Copy
        </CopyButton>
      </div>
    </div>
  )
}

/**
 * Proof that the mouth stands alone: a simple non-notion face (just CSS) with
 * <TalkingMouth> overlaid. No <Avatar>, no bundled art — only @avatalk/mouth.
 */
function StandaloneMouthDemo({
  mouth,
}: {
  mouth: React.RefObject<TalkingMouthHandle | null>
}) {
  return (
    <section className="mx-auto mt-14 max-w-3xl border-t pt-10">
      <h2 className="font-mono text-sm font-semibold tracking-tight">
        The mouth, standalone
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        The same lip-sync mouth on a hand-rolled illustration — just{" "}
        <code className="text-xs">@avatalk/mouth</code>, positioned over your art.
      </p>
      <div className="mt-5 flex items-center gap-6">
        {/* A throwaway "illustration": a peachy face with two dot eyes. */}
        <div
          className="relative size-40 rounded-[42%] shadow-sm ring-1 ring-black/5"
          style={{ background: "#ffd9b3" }}
        >
          <span className="absolute left-[30%] top-[40%] size-3 -translate-x-1/2 rounded-full bg-[#3a2a1a]" />
          <span className="absolute left-[70%] top-[40%] size-3 -translate-x-1/2 rounded-full bg-[#3a2a1a]" />
          <div
            className="absolute"
            style={{ left: "50%", top: "68%", transform: "translate(-50%,-50%)" }}
          >
            <TalkingMouth
              ref={mouth}
              scale={0.9}
              cavity="#7a1f1f"
              tongue="#c75c5c"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={() => mouth.current?.play("/sample-tts.mp3")}>
            <Play className="size-4" /> Play sample
          </Button>
          <Button variant="outline" onClick={() => mouth.current?.listen()}>
            <Mic className="size-4" /> Test mic
          </Button>
          <Button variant="ghost" onClick={() => mouth.current?.stop()}>
            <Square className="size-4" /> Stop
          </Button>
        </div>
      </div>
    </section>
  )
}
