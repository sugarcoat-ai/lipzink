"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Play, Square } from "lucide-react"

import { Mouth } from "@/components/mouth/mouth"
import {
  LIP_SHAPES,
  LIP_SHAPE_LABELS,
  type LipShape,
  textToShapes,
} from "@/components/mouth/lipsync"
import { Button } from "@/components/ui/button"

export default function MouthPage() {
  const [shape, setShape] = useState<LipShape>("rest")
  const [text, setText] = useState("Hello, I am a talking avatar!")
  const [playing, setPlaying] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const playText = useCallback(() => {
    clearTimers()
    const shapes = textToShapes(text)
    if (shapes.length === 0) return
    setPlaying(true)
    const step = 130 // ms per phoneme group
    shapes.forEach((s, i) => {
      timers.current.push(setTimeout(() => setShape(s), i * step))
    })
    timers.current.push(
      setTimeout(() => {
        setShape("rest")
        setPlaying(false)
      }, shapes.length * step),
    )
  }, [text, clearTimers])

  const stop = useCallback(() => {
    clearTimers()
    setPlaying(false)
    setShape("rest")
  }, [clearTimers])

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Phoneme Mouth</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A black &amp; white CSS lip-sync mouth (a fork of LipSync.js). Each
        phoneme group is a shape; switching between them animates the{" "}
        <code className="text-xs">border-radius</code>, size, tongue and teeth.
      </p>

      {/* Stage */}
      <div className="mt-8 flex h-64 items-center justify-center rounded-2xl border bg-white">
        <Mouth shape={shape} scale={2.6} />
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Current shape:{" "}
        <span className="font-medium text-foreground">
          {LIP_SHAPE_LABELS[shape]}
        </span>
      </div>

      {/* Phoneme picker */}
      <div className="mt-6">
        <div className="mb-2 text-sm font-medium">Pick a phoneme shape</div>
        <div className="flex flex-wrap gap-2">
          {LIP_SHAPES.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === shape ? "default" : "outline"}
              onClick={() => {
                stop()
                setShape(s)
              }}
            >
              {LIP_SHAPE_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Text playback */}
      <div className="mt-8">
        <div className="mb-2 text-sm font-medium">Animate from text</div>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Type something to lip-sync…"
          />
          {playing ? (
            <Button onClick={stop} variant="secondary">
              <Square className="size-4" /> Stop
            </Button>
          ) : (
            <Button onClick={playText}>
              <Play className="size-4" /> Play
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Text is mapped grapheme-by-grapheme to phoneme groups, then stepped
          through with a short delay so transitions stay smooth.
        </p>
      </div>
    </main>
  )
}
