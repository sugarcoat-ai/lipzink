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

// Demo clips — each maps to a cached file under `data/tts-cache/`.
const TTS_EXAMPLES = [
  {
    id: "pitch",
    label: "What is lipzink?",
    emoji: "✨",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    voiceName: "Rachel",
    text:
      "What is lipzink? It is a React library that lets you overlay a mouth on an avatar that moves in sync with speech. It works with any audio source, and it is amazing with ElevenLabs timestamps.",
  },
  {
    id: "fox",
    label: "Quick brown fox",
    emoji: "🦊",
    voiceId: "AZnzlk1XvdvUeBnXmlld",
    voiceName: "Domi",
    text: "The quick brown fox jumps over the lazy dog.",
  },
  {
    id: "phonemes",
    label: "Every phoneme",
    emoji: "🎭",
    voiceId: "TxGEqnHWrfWFTfGW9XjX",
    voiceName: "Josh",
    text:
      "The beige hue on the waters of the loch impressed all, including the French queen, before she heard that symphony again.",
  },
] as const

const PLAYLIST_GRADIENTS = [
  "from-[oklch(0.78_0.14_15)] to-[oklch(0.62_0.19_15)]",
  "from-[oklch(0.74_0.12_280)] to-[oklch(0.58_0.16_280)]",
  "from-[oklch(0.76_0.11_155)] to-[oklch(0.6_0.14_155)]",
] as const

const LEFT_PARTS: AvatarCategory[] = ["hair", "glasses", "beard", "accessories"]
const RIGHT_PARTS: AvatarCategory[] = ["face", "eyebrows", "eyes", "nose", "details"]

const INSTALL_CMD = "npm i @lipzink/avatar @lipzink/mouth"
const REPO_URL = "https://github.com/sugarcoat-ai/lipzink"

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
  const speech = await fetchElevenLabsSpeech("/api/tts-mock", { text, voiceId })
  await voice.playCues(speech.audio, speech.cues)
}

// --- Code samples ---------------------------------------------------------

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

const FEATURE_TINTS = [
  "bg-[oklch(0.97_0.04_15/0.5)]",
  "bg-[oklch(0.96_0.05_280/0.45)]",
  "bg-[oklch(0.96_0.04_145/0.45)]",
  "bg-[oklch(0.97_0.05_85/0.5)]",
  "bg-[oklch(0.96_0.05_330/0.4)]",
  "bg-[oklch(0.97_0.04_15/0.45)]",
  "bg-[oklch(0.96_0.05_280/0.4)]",
  "bg-[oklch(0.96_0.04_145/0.4)]",
] as const

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
  const [activeExample, setActiveExample] = useState<string | null>(null)
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

  async function handleExample(example: (typeof TTS_EXAMPLES)[number]) {
    if (!voice.current) return
    setActiveExample(example.id)
    setError(null)
    setSynthesizing(true)
    try {
      await speak(voice.current, example.text, example.voiceId)
    } catch (err) {
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
      <header className="border-b border-primary/10 bg-background/75 sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <span className="text-hero-gradient font-mono text-sm font-semibold tracking-tight">
            lipzink
          </span>
          <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary sm:inline">
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
      <section className="bg-hero-gradient relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <a
              href="#voice"
              className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-xs text-primary transition-colors hover:bg-primary/15"
            >
              <Sparkles className="size-3.5" />
              voice-agnostic lip-sync for React
            </a>
            <h1 className="text-hero-gradient text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Make your avatar talk.
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty sm:text-lg">
              A notion-style talking avatar and a pure-CSS lip-sync mouth. Build a
              face, feed it any audio — ElevenLabs, a recording, the mic — and the
              mouth follows every phoneme. Then drop it into your app.
            </p>
          </div>

          {/* Talking avatar + console */}
          <div className="mx-auto mt-12 grid max-w-4xl items-start gap-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-8">
            <div className="animate-rise flex w-full flex-col items-center gap-3">
              <div
                className="rounded-[2rem] p-5 shadow-md ring-1 ring-primary/15"
                style={{
                  background:
                    "linear-gradient(145deg, #fff5eb 0%, #f5e8ff 55%, #e8fff5 100%)",
                }}
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

            <div className="bg-card/90 animate-rise flex w-full min-w-0 flex-col rounded-2xl border border-primary/10 p-4 shadow-md shadow-primary/5 backdrop-blur-sm sm:p-5">
              <label className="kicker mb-3 block">try an example</label>
              <ul className="flex flex-1 flex-col gap-1.5">
                {TTS_EXAMPLES.map((example, index) => {
                  const playing = activeExample === example.id && busy
                  return (
                    <li key={example.id}>
                      <button
                        type="button"
                        onClick={() =>
                          playing
                            ? voice.current?.stop()
                            : handleExample(example)
                        }
                        disabled={busy && !playing}
                        aria-label={
                          playing ? `Stop ${example.label}` : `Play ${example.label}`
                        }
                        className={cn(
                          "group grid w-full grid-cols-[2.5rem_minmax(0,1fr)_1.75rem] items-center gap-3 rounded-full px-2 py-2 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          playing
                            ? "bg-primary/10 ring-1 ring-primary/25"
                            : "hover:bg-accent/60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-105 group-disabled:scale-100",
                            PLAYLIST_GRADIENTS[index % PLAYLIST_GRADIENTS.length],
                          )}
                        >
                          {playing ? (
                            <Square className="size-3.5 fill-current" />
                          ) : (
                            <Play className="size-4 fill-current translate-x-px" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium leading-tight">
                            {example.label}
                          </span>
                          <span className="text-muted-foreground block truncate text-[11px] leading-tight">
                            {example.voiceName}
                          </span>
                        </span>
                        <span className="text-center text-base leading-none opacity-80" aria-hidden>
                          {example.emoji}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setAvatarConfig(randomAvatar())}
                >
                  <Shuffle className="size-4" /> Randomize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => voice.current?.playAudio("/sample-tts.mp3")}
                  disabled={busy}
                >
                  <Play className="size-4" /> Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => voice.current?.startMic()}
                  disabled={busy}
                >
                  <Mic className="size-4" /> Mic
                </Button>
                {busy ? (
                  <Button
                    size="sm"
                    variant="default"
                    className="rounded-full"
                    onClick={() => voice.current?.stop()}
                  >
                    <Square className="size-4" /> Stop
                  </Button>
                ) : null}
              </div>
              {error ? (
                <p className="text-muted-foreground mt-3 text-center text-xs">{error}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Use case 01 · Voice / code ---------- */}
      <Section id="voice" className="bg-section-warm border-t-0">
        <SectionHeader kicker="Use case 01 · Give it a voice" title="Two lines to talking">
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

      {/* ---------- Use case 02 · Mouth only ---------- */}
      <Section id="mouth" className="bg-section-cool">
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

      {/* ---------- Use case 03 · Your own face ---------- */}
      <Section id="own" className="bg-section-warm">
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

      {/* ---------- Build your avatar ---------- */}
      <Section id="build">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader kicker="Bonus · Create" title="Build your avatar">
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
              className="rounded-[2rem] p-5 shadow-md ring-1 ring-primary/15"
              style={{
                background:
                  "linear-gradient(145deg, #fff5eb 0%, #f5e8ff 55%, #e8fff5 100%)",
              }}
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

      {/* ---------- Features ---------- */}
      <Section id="features">
        <SectionHeader kicker="Everything else" title="Built to drop in">
          Small, typed, and unopinionated about your stack.
        </SectionHeader>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-primary/10 bg-border/70 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Feature key={f.title} {...f} tint={FEATURE_TINTS[i % FEATURE_TINTS.length]} />
          ))}
        </div>
      </Section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-primary/10 bg-gradient-to-b from-transparent to-primary/5">
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
          <a
            href="https://sugarcoat.ai"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors"
          >
            <span className="text-xs">designed by</span>
            <img
              src="/sugarcoat_logo.png"
              alt="Sugarcoat"
              className="h-13 w-auto"
            />
          </a>
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
    <div className="bg-card flex flex-col rounded-2xl border border-primary/10 p-5 shadow-sm">
      <div className="kicker mb-1">13 shapes · every phoneme</div>
      <p className="text-muted-foreground mb-4 text-sm">
        Whatever drives the mouth — timestamps, live audio, the mic — resolves to
        one of these. Tap to preview.
      </p>
      <div
        className="mb-4 flex items-center justify-center rounded-xl py-8"
        style={{
          background:
            "linear-gradient(145deg, #fff0e8 0%, #f3e8ff 50%, #e5fff3 100%)",
        }}
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
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-foreground",
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

function Feature({
  icon: Icon,
  title,
  body,
  tint,
}: FeatureItem & { tint: string }) {
  return (
    <div className={cn("p-6 transition-colors hover:brightness-[0.98]", tint)}>
      <Icon className="mb-3 size-5 text-primary" strokeWidth={1.75} />
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
        {body}
      </p>
    </div>
  )
}
