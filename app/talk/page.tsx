"use client"

import { useState } from "react"
import { Mic, Square, Volume2 } from "lucide-react"

import { TalkingAvatar } from "@/components/avatar/talking-avatar"
import { useTalkingMouth } from "@/components/talk/use-talking-mouth"
import { Button } from "@/components/ui/button"
import { useAvatarConfig } from "@/lib/use-avatar"

// A handful of ElevenLabs stock voices.
const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
]

export default function TalkPage() {
  const config = useAvatarConfig()
  const [text, setText] = useState(
    "Hi! I'm an avatar, and my mouth is driven by a real-time audio analyser.",
  )
  const [voiceId, setVoiceId] = useState(VOICES[0].id)

  const { shape, amplitude, status, error, speak, speakSample, startMic, stop } =
    useTalkingMouth()

  const busy = status === "speaking" || status === "listening"

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Talk (ElevenLabs)</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Synthesize speech with ElevenLabs and drive the avatar&apos;s mouth from
        a live FFT analyser (<code className="text-xs">wawa-lipsync</code>). Uses
        the avatar you built in the maker. No API key? Use the mic to test the
        analyser.
      </p>

      <div className="mt-8 flex flex-col items-center gap-5">
        <TalkingAvatar
          config={config}
          shape={shape}
          amplitude={amplitude}
          size={300}
          className="shadow-sm ring-1 ring-black/5"
        />

        {/* Amplitude meter */}
        <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/70 transition-[width] duration-75"
            style={{ width: `${Math.round(amplitude * 100)}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {status === "idle" && "Ready"}
          {status === "loading" && "Synthesizing…"}
          {status === "speaking" && "Speaking · shape: " + shape}
          {status === "listening" && "Listening · shape: " + shape}
          {status === "error" && "Error"}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Type something for the avatar to say…"
        />

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground">Voice</label>
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

          <div className="ml-auto flex gap-2">
            {busy ? (
              <Button onClick={stop} variant="secondary">
                <Square className="size-4" /> Stop
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={speakSample}>
                  Play sample
                </Button>
                <Button variant="outline" onClick={startMic}>
                  <Mic className="size-4" /> Test mic
                </Button>
                <Button
                  onClick={() => speak({ text, voiceId })}
                  disabled={status === "loading" || !text.trim()}
                >
                  <Volume2 className="size-4" />
                  {status === "loading" ? "Synthesizing…" : "Speak"}
                </Button>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {/* Floating talking-UI bubble, bottom-right */}
      <div className="fixed bottom-6 right-6 z-50">
        <TalkingAvatar
          config={config}
          shape={shape}
          amplitude={amplitude}
          size={96}
          background="#ffffff"
          className="shadow-lg ring-1 ring-black/10"
        />
      </div>
    </main>
  )
}
