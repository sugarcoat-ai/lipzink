"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowUpRight,
  AudioLines,
  Boxes,
  Check,
  Copy,
  Gauge,
  type LucideIcon,
  MessageSquare,
  Mic,
  Package,
  Palette,
  Play,
  Shuffle,
  Sparkles,
  Square,
  Volume2,
  Wand2,
} from "lucide-react"

import {
  Avatar,
  type AvatarCategory,
  type AvatarConfig,
  type AvatarVoiceHandle,
  randomAvatar,
} from "@lipzink/avatar"
import {
  fetchElevenLabsSpeech,
  type LipShape,
  LIP_SHAPES,
  LIP_SHAPE_LABELS,
  type LipsyncStatus,
  Mouth,
  TalkingMouth,
  type TalkingMouthHandle,
} from "@lipzink/mouth"
import { PartCarousel } from "@/components/avatar/part-picker"
import { CodeWindow } from "@/components/site/code-window"
import { MonaLisa } from "@/components/site/mona-lisa"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { setAvatarConfig, useAvatarConfig } from "@/lib/use-avatar"

// A phonetic pangram — unlike the letter pangram "the quick brown fox…", this
// sentence exercises (close to) every English phoneme, so the mouth runs
// through its whole repertoire of shapes.
const PANGRAM =
  "The beige hue on the waters of the loch impressed all, including the French queen, before she heard that symphony again."

const LEFT_PARTS: AvatarCategory[] = ["hair", "glasses", "beard", "accessories"]
const RIGHT_PARTS: AvatarCategory[] = ["face", "eyebrows", "eyes", "nose", "details"]

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
]

const INSTALL_CMD = "npm i @lipzink/avatar @lipzink/mouth"
const REPO_URL = "https://github.com/"

function specText(config: AvatarConfig): string {
  return JSON.stringify(config, null, 2)
}

/**
 * App-side glue: synthesize speech with ElevenLabs and drive the avatar from
 * the returned character timestamps. The library itself never does TTS.
 */
async function speak(
  voice: AvatarVoiceHandle,
  text: string,
  voiceId: string,
): Promise<void> {
  const speech = await fetchElevenLabsSpeech("/api/tts", { text, voiceId })
  await voice.playCues(speech.audio, speech.cues)
}

// --- Code samples ---------------------------------------------------------

const HERO_CODE = `import { Avatar } from "@lipzink/avatar"
import "@lipzink/avatar/styles.css"

// "spec" is the JSON you build & copy below
export function Hi({ spec }) {
  return <Avatar spec={spec} size={96} />
}`

const ELEVEN_CODE = `import { useRef } from "react"
import { Avatar, type AvatarVoiceHandle } from "@lipzink/avatar"
import { fetchElevenLabsSpeech } from "@lipzink/mouth"
import "@lipzink/avatar/styles.css"
import "@lipzink/mouth/styles.css"

function Talking({ spec }) {
  const voice = useRef<AvatarVoiceHandle>(null)

  async function say(text: string) {
    // /api/tts proxies ElevenLabs' /with-timestamps (key stays server-side).
    const { audio, cues } = await fetchElevenLabsSpeech("/api/tts", {
      text,
      voiceId: "21m00Tcm4TlvDq8ikWAM",
    })
    // Scheduled against the audio clock → lands on every phoneme, on time.
    voice.current?.playCues(audio, cues)
  }

  return <Avatar spec={spec} ref={voice} onClick={() => say("Hello there!")} />
}`

const ANY_AUDIO_CODE = `import { useRef } from "react"
import { Avatar, type AvatarVoiceHandle } from "@lipzink/avatar"
import "@lipzink/avatar/styles.css"
import "@lipzink/mouth/styles.css"

function Talking({ spec }) {
  const voice = useRef<AvatarVoiceHandle>(null)

  // No timestamps? Hand it ANY audio — a recording, OpenAI TTS, a URL — and
  // the mouth follows it live (reactive analysis). Or open the microphone.
  return (
    <Avatar
      spec={spec}
      ref={voice}
      onClick={() => voice.current?.playAudio("/hello.mp3")}
    />
    // voice.current?.startMic()  ·  voice.current?.stop()
  )
}`

const MOUTH_CODE = `import { TalkingMouth } from "@lipzink/mouth"
import "@lipzink/mouth/styles.css"

// Just the mouth — no avatar, no bundled art. Overlay it on your illustration:
function MyCharacter() {
  return (
    <div style={{ position: "relative" }}>
      <img src="/character.png" alt="" />
      <div style={{ position: "absolute", left: "50%", top: "62%",
                    transform: "translate(-50%,-50%)" }}>
        <TalkingMouth audio="/hello.mp3" scale={1.4} />
      </div>
    </div>
  )
}`

const OWN_FACE_CODE = `import { useRef } from "react"
import { TalkingMouth, type TalkingMouthHandle } from "@lipzink/mouth"
import "@lipzink/mouth/styles.css"

function Portrait() {
  const mouth = useRef<TalkingMouthHandle>(null)
  return (
    <div style={{ position: "relative" }}>
      <img src="/mona-lisa.png" alt="Mona Lisa" />
      {/* Position + tint the mouth to match YOUR art */}
      <div style={{ position: "absolute", left: "50%", top: "56%",
                    transform: "translate(-50%,-50%)" }}>
        <TalkingMouth ref={mouth} scale={0.7} cavity="#7a1f1f" tongue="#c75c5c" />
      </div>
      <button onClick={() => mouth.current?.play("/hello.mp3")}>Speak</button>
    </div>
  )
}`

// --- Small building blocks -----------------------------------------------

function CopyButton({
  value,
  children,
  variant = "outline",
  size = "default",
}: {
  value: string
  children: React.ReactNode
  variant?: "outline" | "ghost" | "secondary"
  size?: "default" | "sm"
}) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant={variant}
      size={size}
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

function SectionHeader({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-8 max-w-2xl">
      <div className="kicker mb-3">{kicker}</div>
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {children && (
        <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed">
          {children}
        </p>
      )}
    </div>
  )
}

function Section({
  id,
  className,
  children,
}: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn(
        "mx-auto max-w-6xl scroll-mt-20 border-t border-border/70 px-6 py-20 sm:py-24",
        className,
      )}
    >
      {children}
    </section>
  )
}

// --- Page ----------------------------------------------------------------

export default function Page() {
  const config = useAvatarConfig()
  const [text, setText] = useState(PANGRAM)
  const [voiceId, setVoiceId] = useState(VOICES[0].id)
  const [status, setStatus] = useState<LipsyncStatus>("idle")
  const [synthesizing, setSynthesizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const voice = useRef<AvatarVoiceHandle>(null)
  const randomized = useRef(false)

  // Greet visitors with a fresh, random face (only if they have no saved one).
  useEffect(() => {
    if (randomized.current) return
    randomized.current = true
    if (!window.localStorage.getItem("lipzink:avatar")) {
      setAvatarConfig(randomAvatar())
    }
  }, [])

  const busy = status === "speaking" || status === "listening" || synthesizing

  async function handleTalk() {
    if (!voice.current) return
    setError(null)
    setSynthesizing(true)
    try {
      await speak(voice.current, text, voiceId)
    } catch (err) {
      // No API key / quota? Still show off the mouth with the bundled sample.
      setError(
        err instanceof Error
          ? `${err.message} — playing the sample instead.`
          : "Speech failed — playing the sample instead.",
      )
      try {
        await voice.current.playAudio("/sample-tts.mp3")
      } catch {
        /* ignore */
      }
    } finally {
      setSynthesizing(false)
    }
  }

  return (
    <div className="min-h-dvh">
      {/* ---------- Nav ---------- */}
      <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <span className="font-mono text-sm font-semibold tracking-tight">
            lipzink
          </span>
          <span className="bg-muted text-muted-foreground hidden rounded-full px-2 py-0.5 font-mono text-[10px] sm:inline">
            v0.1
          </span>
          <nav className="ml-auto flex items-center gap-1">
            <CopyButton value={INSTALL_CMD} variant="ghost" size="sm">
              <span className="hidden font-mono text-xs sm:inline">npm i</span>
            </CopyButton>
            <Button asChild variant="ghost" size="sm">
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                GitHub <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </nav>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <a
              href="#build"
              className="text-muted-foreground hover:text-foreground hover:border-foreground/30 mb-6 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs transition-colors"
            >
              <Sparkles className="size-3.5" />
              voice-agnostic lip-sync for React
            </a>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Make your avatar talk.
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
              A notion-style talking avatar and a pure-CSS lip-sync mouth. Build a
              face, feed it any audio — ElevenLabs, a recording, the mic — and the
              mouth follows every phoneme. Then drop it into your app.
            </p>
          </div>

          {/* Talking avatar + console */}
          <div className="mx-auto mt-12 grid max-w-4xl items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
            <div className="animate-rise flex flex-col items-center gap-3 justify-self-center">
              <div
                className="rounded-[2rem] p-5 shadow-sm ring-1 ring-black/5"
                style={{ background: "#f5f1ea" }}
              >
                <Avatar
                  spec={config}
                  ref={voice}
                  onStatusChange={setStatus}
                  size={240}
                />
              </div>
              <StatusPill status={status} synthesizing={synthesizing} />
            </div>

            <div className="bg-card animate-rise w-full rounded-2xl border p-4 shadow-sm sm:p-5">
              <label className="kicker mb-2 block">say something</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="focus-visible:ring-ring/40 w-full resize-none rounded-lg border bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2"
                placeholder="Type something for the avatar to say…"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="bg-background h-8 rounded-lg border px-2 text-sm outline-none"
                  aria-label="Voice"
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>

                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => voice.current?.playAudio("/sample-tts.mp3")}
                    disabled={busy}
                  >
                    <Play className="size-4" /> Sample
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => voice.current?.startMic()}
                    disabled={busy}
                  >
                    <Mic className="size-4" /> Mic
                  </Button>
                  {busy ? (
                    <Button size="sm" variant="secondary" onClick={() => voice.current?.stop()}>
                      <Square className="size-4" /> Stop
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleTalk} disabled={!text.trim()}>
                      <Volume2 className="size-4" /> Make it talk
                    </Button>
                  )}
                </div>
              </div>
              {error ? (
                <p className="text-muted-foreground mt-2.5 text-xs">{error}</p>
              ) : (
                <p className="text-muted-foreground mt-2.5 text-xs">
                  That’s a phonetic pangram — every English sound.{" "}
                  <span className="opacity-70">
                    “Sample” needs no key; “Make it talk” uses ElevenLabs via{" "}
                    <code>/api/tts</code>.
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Simple example of the Avatar code */}
          <div className="mx-auto mt-10 max-w-xl">
            <CodeWindow
              tabs={[{ label: "Avatar", file: "hi.tsx", code: HERO_CODE }]}
            />
          </div>
        </div>
      </section>

      {/* ---------- Step 01 · Build ---------- */}
      <Section id="build">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader kicker="Step 01 · Create" title="Build your avatar">
            Click through the parts — or roll the dice. The avatar above updates
            live. When you like it, copy the spec: a tiny JSON blob you pass to{" "}
            <code className="text-xs">&lt;Avatar spec /&gt;</code>.
          </SectionHeader>
          <div className="mb-8 flex gap-2">
            <Button variant="outline" onClick={() => setAvatarConfig(randomAvatar())}>
              <Shuffle className="size-4" /> Randomize
            </Button>
            <CopyButton value={specText(config)}>Copy spec</CopyButton>
          </div>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="order-2 flex flex-col gap-5 lg:order-1">
            {LEFT_PARTS.map((cat) => (
              <PartCarousel key={cat} category={cat} config={config} align="right" />
            ))}
          </div>
          <div className="order-1 flex justify-center lg:order-2">
            <div
              className="rounded-[2rem] p-5 ring-1 ring-black/5"
              style={{ background: "#f5f1ea" }}
            >
              <Avatar spec={config} size={260} />
            </div>
          </div>
          <div className="order-3 flex flex-col gap-5">
            {RIGHT_PARTS.map((cat) => (
              <PartCarousel key={cat} category={cat} config={config} align="left" />
            ))}
          </div>
        </div>
      </Section>

      {/* ---------- Step 02 · Voice / code ---------- */}
      <Section id="voice">
        <SectionHeader kicker="Step 02 · Give it a voice" title="Two lines to talking">
          The avatar is voice-agnostic — you bring the sound. With ElevenLabs
          timestamps the mouth lands on every phoneme on time; with any other
          audio it follows along live. Pick your lane:
        </SectionHeader>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <CodeWindow
            tabs={[
              { label: "With ElevenLabs", file: "talking.tsx", code: ELEVEN_CODE },
              { label: "Any audio / mic", file: "talking.tsx", code: ANY_AUDIO_CODE },
            ]}
          />
          <VisemeExplorer />
        </div>
      </Section>

      {/* ---------- Case 02 · Mouth only ---------- */}
      <Section id="mouth">
        <SectionHeader kicker="Use case 02 · Mouth only" title="Just the mouth">
          Don’t need the whole character? <code className="text-xs">@lipzink/mouth</code>{" "}
          is a standalone, pure-CSS mouth — no avatar, no assets. Position it over
          any illustration and tint it to match.
        </SectionHeader>

        <div className="grid items-center gap-8 lg:grid-cols-[auto_minmax(0,1fr)]">
          <StandaloneMouthDemo />
          <CodeWindow
            tabs={[{ label: "Mouth", file: "character.tsx", code: MOUTH_CODE }]}
          />
        </div>
      </Section>

      {/* ---------- Case 03 · Your own face ---------- */}
      <Section id="own">
        <SectionHeader kicker="Use case 03 · Bring your own face" title="Put a mouth on anything">
          The mouth is just a positioned CSS element — so it works on a photo, an
          illustration, even a Renaissance masterpiece. Here she is, finally able
          to answer the question everyone asks.
        </SectionHeader>

        <div className="grid items-center gap-10 lg:grid-cols-[auto_minmax(0,1fr)]">
          <MonaLisaDemo />
          <CodeWindow
            tabs={[{ label: "Your art", file: "portrait.tsx", code: OWN_FACE_CODE }]}
          />
        </div>
      </Section>

      {/* ---------- Features ---------- */}
      <Section id="features">
        <SectionHeader kicker="Everything else" title="Built to drop in">
          Small, typed, and unopinionated about your stack.
        </SectionHeader>
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Feature key={f.title} {...f} />
          ))}
        </div>
      </Section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm sm:flex-row">
          <div className="flex items-center gap-2">
            <a
              href="https://lipz.ink"
              className="font-mono font-semibold tracking-tight hover:text-foreground transition-colors"
            >
              lipz.ink
            </a>
            <span className="text-muted-foreground/70">·</span>
            <span>MIT licensed</span>
          </div>
          <CopyButton value={INSTALL_CMD} variant="ghost" size="sm">
            <span className="font-mono text-xs">{INSTALL_CMD}</span>
          </CopyButton>
        </div>
      </footer>
    </div>
  )
}

// --- Status pill ----------------------------------------------------------

function StatusPill({
  status,
  synthesizing,
}: {
  status: LipsyncStatus
  synthesizing: boolean
}) {
  const label = synthesizing
    ? "synthesizing…"
    : status === "speaking"
      ? "speaking…"
      : status === "listening"
        ? "listening…"
        : status === "error"
          ? "error"
          : "ready"
  const live = synthesizing || status === "speaking" || status === "listening"
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2 font-mono text-[11px]">
      <span
        className={cn(
          "size-1.5 rounded-full",
          live ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/40",
        )}
      />
      {label}
    </span>
  )
}

// --- Viseme explorer (inline mouth + chips) -------------------------------

function VisemeExplorer() {
  const [shape, setShape] = useState<LipShape>("aei")
  return (
    <div className="bg-card flex flex-col rounded-2xl border p-5">
      <div className="kicker mb-1">13 shapes · every phoneme</div>
      <p className="text-muted-foreground mb-4 text-sm">
        Whatever drives the mouth — timestamps, live audio, the mic — resolves to
        one of these. Tap to preview.
      </p>
      <div
        className="mb-4 flex items-center justify-center rounded-xl py-8"
        style={{ background: "#f5f1ea" }}
      >
        <Mouth shape={shape} scale={1.6} cavity="#7a1f1f" tongue="#c75c5c" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LIP_SHAPES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={shape === s}
            onClick={() => setShape(s)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
              shape === s
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {LIP_SHAPE_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Standalone mouth demo ------------------------------------------------

function StandaloneMouthDemo() {
  const mouth = useRef<TalkingMouthHandle>(null)
  return (
    <div className="flex flex-col items-center gap-5 justify-self-center">
      <div
        className="relative size-48 rounded-[42%] shadow-sm ring-1 ring-black/5"
        style={{ background: "#ffd9b3" }}
      >
        <span className="absolute left-[32%] top-[40%] size-3 -translate-x-1/2 rounded-full bg-[#3a2a1a]" />
        <span className="absolute left-[68%] top-[40%] size-3 -translate-x-1/2 rounded-full bg-[#3a2a1a]" />
        <div
          className="absolute"
          style={{ left: "50%", top: "68%", transform: "translate(-50%,-50%)" }}
        >
          <TalkingMouth ref={mouth} scale={1} cavity="#7a1f1f" tongue="#c75c5c" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => mouth.current?.play("/sample-tts.mp3")}>
          <Play className="size-4" /> Play
        </Button>
        <Button size="sm" variant="outline" onClick={() => mouth.current?.listen()}>
          <Mic className="size-4" /> Mic
        </Button>
        <Button size="sm" variant="ghost" onClick={() => mouth.current?.stop()}>
          <Square className="size-4" /> Stop
        </Button>
      </div>
    </div>
  )
}

// --- Mona Lisa demo -------------------------------------------------------

function MonaLisaDemo() {
  const mouth = useRef<TalkingMouthHandle>(null)
  return (
    <div className="flex flex-col items-center gap-5 justify-self-center">
      <MonaLisa
        mouth={
          <TalkingMouth ref={mouth} scale={0.62} cavity="#5b3a2e" tongue="#b06a52" />
        }
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => mouth.current?.play("/sample-tts.mp3")}>
          <Play className="size-4" /> Speak
        </Button>
        <Button size="sm" variant="outline" onClick={() => mouth.current?.listen()}>
          <Mic className="size-4" /> Mic
        </Button>
        <Button size="sm" variant="ghost" onClick={() => mouth.current?.stop()}>
          <Square className="size-4" /> Stop
        </Button>
      </div>
    </div>
  )
}

// --- Features -------------------------------------------------------------

type FeatureItem = { icon: LucideIcon; title: string; body: string }

const FEATURES: FeatureItem[] = [
  {
    icon: AudioLines,
    title: "Voice-agnostic",
    body: "Bring any audio — ElevenLabs, OpenAI TTS, a recording, or the live microphone. No TTS is baked in.",
  },
  {
    icon: Gauge,
    title: "On-time lip-sync",
    body: "ElevenLabs timestamps schedule visemes against the audio clock, so the mouth lands on each phoneme instead of trailing it.",
  },
  {
    icon: Boxes,
    title: "Three drivers",
    body: "Scheduled cues, live audio analysis, or swap in your own — one headless useLipsync hook behind them all.",
  },
  {
    icon: MessageSquare,
    title: "13 visemes",
    body: "Every phoneme maps to a CSS mouth shape. Mappings ship for ElevenLabs, Azure visemes, plain text, and live audio.",
  },
  {
    icon: Palette,
    title: "Pure-CSS mouth",
    body: "No canvas, no WebGL. The mouth is a positioned, tintable CSS element you can drop over any illustration.",
  },
  {
    icon: Wand2,
    title: "Notion-style avatar",
    body: "Hundreds of bundled SVG parts, a randomizer, and a copy-paste spec — the whole character travels as JSON.",
  },
  {
    icon: Package,
    title: "Tiny & typed",
    body: "React 19, full TypeScript, no heavy dependencies. Two packages you can adopt together or apart.",
  },
  {
    icon: Sparkles,
    title: "Headless option",
    body: "useLipsync() hands you { shape, amplitude, status } so you can build entirely custom visuals on top.",
  },
]

function Feature({ icon: Icon, title, body }: FeatureItem) {
  return (
    <div className="bg-card hover:bg-muted/40 p-6 transition-colors">
      <Icon className="text-foreground mb-3 size-5" strokeWidth={1.75} />
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
        {body}
      </p>
    </div>
  )
}
