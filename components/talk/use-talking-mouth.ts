"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Lipsync } from "wawa-lipsync"

import { type LipShape, wawaVisemeToShape } from "@/components/mouth/lipsync"

export type TalkStatus = "idle" | "loading" | "speaking" | "listening" | "error"

type SpeakOptions = { text: string; voiceId?: string }

/**
 * Drives the lip-sync mouth from live audio using wawa-lipsync.
 *
 * wawa-lipsync owns its own AudioContext + AnalyserNode. We feed it an
 * <audio> element playing ElevenLabs TTS (or the microphone), then on each
 * animation frame call `processAudio()` and map its Oculus viseme onto our
 * mouth shapes. `features.volume` drives the amplitude meter / mouth openness.
 */
export function useTalkingMouth() {
  const [shape, setShape] = useState<LipShape>("rest")
  const [amplitude, setAmplitude] = useState(0)
  const [status, setStatus] = useState<TalkStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const lipsyncRef = useRef<Lipsync | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const ensureManager = useCallback(() => {
    if (!lipsyncRef.current) {
      lipsyncRef.current = new Lipsync({ fftSize: 2048, historySize: 10 })
    }
    return lipsyncRef.current
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startLoop = useCallback(() => {
    stopLoop()
    const tick = () => {
      const manager = lipsyncRef.current
      if (manager) {
        manager.processAudio()
        // setState bails when unchanged, so the mouth only re-renders on a
        // genuine viseme change; amplitude is a small number we update freely.
        setShape(wawaVisemeToShape(manager.viseme))
        setAmplitude(Math.min(1, (manager.features?.volume ?? 0) / 100))
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopLoop])

  const stop = useCallback(() => {
    stopLoop()
    const audio = audioElRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setAmplitude(0)
    setShape("rest")
    setStatus("idle")
  }, [stopLoop])

  // Shared playback path for any audio URL (TTS blob or bundled sample): point
  // the reused <audio> element at it, hand it to wawa-lipsync, and start the
  // per-frame viseme loop.
  const playUrl = useCallback(
    async (url: string, revokeWhenDone: boolean) => {
      const manager = ensureManager()
      if (!audioElRef.current) {
        audioElRef.current = new Audio()
        audioElRef.current.addEventListener("ended", () => stop())
      }
      const audio = audioElRef.current

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      if (revokeWhenDone) objectUrlRef.current = url

      // wawa-lipsync requires a valid src before connecting.
      audio.src = url
      manager.connectAudio(audio)

      setStatus("speaking")
      startLoop()
      await audio.play()
    },
    [ensureManager, startLoop, stop],
  )

  const speak = useCallback(
    async ({ text, voiceId }: SpeakOptions) => {
      setError(null)
      setStatus("loading")
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `TTS failed (${res.status})`)
        }
        const blob = await res.blob()
        await playUrl(URL.createObjectURL(blob), true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
        setStatus("error")
        stopLoop()
        setShape("rest")
      }
    },
    [playUrl, stopLoop],
  )

  /** Play a bundled speech clip through the analyser (no API key/credits). */
  const speakSample = useCallback(async () => {
    setError(null)
    try {
      await playUrl("/sample-tts.mp3", false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not play sample")
      setStatus("error")
      stopLoop()
      setShape("rest")
    }
  }, [playUrl, stopLoop])

  const startMic = useCallback(async () => {
    setError(null)
    try {
      const manager = ensureManager()
      await manager.connectMicrophone()
      setStatus("listening")
      startLoop()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Microphone access was denied",
      )
      setStatus("error")
    }
  }, [ensureManager, startLoop])

  useEffect(() => {
    return () => {
      stopLoop()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [stopLoop])

  return { shape, amplitude, status, error, speak, speakSample, startMic, stop }
}
