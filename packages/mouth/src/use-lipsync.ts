"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Lipsync } from "wawa-lipsync"

import { type LipShape, wawaVisemeToShape } from "./lipsync"

export type LipsyncStatus = "idle" | "speaking" | "listening" | "error"

/** One analysed frame: the phoneme group and a 0..1 loudness. */
export type LipsyncFrame = { shape: LipShape; amplitude: number }

/**
 * The audio → mouth seam. An analyser owns whatever DSP turns sound into a
 * mouth shape; `useLipsync` just drives it on each animation frame. Implement
 * this to plug in your own detector (or to drive the mouth from TTS viseme
 * events). The default is wawa-lipsync — see {@link WawaAnalyser}.
 */
export interface LipsyncAnalyser {
  /** Attach an <audio> element so playback can be analysed. */
  connectAudio(el: HTMLAudioElement): void
  /** Open the microphone and analyse the live input. */
  connectMicrophone(): Promise<unknown>
  /** Sample the current audio and return the mouth shape + loudness. */
  analyze(): LipsyncFrame
}

export type WawaOptions = { fftSize?: number; historySize?: number }

/**
 * Default analyser: wawa-lipsync owns its own AudioContext + AnalyserNode,
 * reports an Oculus viseme we map onto our shapes, and a volume we normalise to
 * 0..1 for the amplitude meter.
 */
export class WawaAnalyser implements LipsyncAnalyser {
  private readonly manager: Lipsync
  constructor({ fftSize = 2048, historySize = 10 }: WawaOptions = {}) {
    this.manager = new Lipsync({ fftSize, historySize })
  }
  connectAudio(el: HTMLAudioElement) {
    this.manager.connectAudio(el)
  }
  connectMicrophone() {
    return this.manager.connectMicrophone()
  }
  analyze(): LipsyncFrame {
    this.manager.processAudio()
    return {
      shape: wawaVisemeToShape(this.manager.viseme),
      amplitude: Math.min(1, (this.manager.features?.volume ?? 0) / 100),
    }
  }
}

export type UseLipsyncOptions = WawaOptions & {
  /** Swap in your own detector. Defaults to {@link WawaAnalyser}. */
  analyser?: LipsyncAnalyser
}

export type UseLipsyncReturn = {
  /** Current phoneme group — feed this straight to <Mouth shape>. */
  shape: LipShape
  /** 0..1 loudness; handy for scaling the mouth so louder speech opens wider. */
  amplitude: number
  status: LipsyncStatus
  error: string | null
  /**
   * Drive the mouth from any audio you supply — a URL (we create the <audio>),
   * or your own <audio> element (e.g. one already playing). This is the
   * voice-agnostic entry point: bring ElevenLabs, OpenAI, a recording, anything.
   */
  connect: (src: string | HTMLAudioElement) => Promise<void>
  /** Drive the mouth from the live microphone. */
  connectMic: () => Promise<void>
  /** Stop playback / listening and close the mouth. */
  stop: () => void
}

/**
 * Headless lip-sync: analyses whatever audio you connect and exposes the
 * resulting `{ shape, amplitude, status }`. Render it however you like — pass
 * `shape` to <Mouth>, or build your own visuals on top. There is no TTS in
 * here; you supply the audio.
 */
export function useLipsync(options: UseLipsyncOptions = {}): UseLipsyncReturn {
  const [shape, setShape] = useState<LipShape>("rest")
  const [amplitude, setAmplitude] = useState(0)
  const [status, setStatus] = useState<LipsyncStatus>("idle")
  const [error, setError] = useState<string | null>(null)

  const analyserRef = useRef<LipsyncAnalyser | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  // Keep the latest options in a ref so the callbacks below stay stable.
  const optionsRef = useRef(options)
  optionsRef.current = options

  const ensureAnalyser = useCallback((): LipsyncAnalyser => {
    let analyser = analyserRef.current
    if (!analyser) {
      const opts = optionsRef.current
      analyser = opts.analyser ?? new WawaAnalyser(opts)
      analyserRef.current = analyser
    }
    return analyser
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
      const analyser = analyserRef.current
      if (analyser) {
        const frame = analyser.analyze()
        // setState bails when unchanged, so the mouth only re-renders on a
        // genuine viseme change; amplitude is a small number we update freely.
        setShape(frame.shape)
        setAmplitude(frame.amplitude)
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

  const connect = useCallback(
    async (src: string | HTMLAudioElement) => {
      setError(null)
      try {
        const analyser = ensureAnalyser()

        // Revoke any object URL we created for a previous clip.
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
          objectUrlRef.current = null
        }

        let audio: HTMLAudioElement
        if (typeof src === "string") {
          if (!audioElRef.current) {
            audioElRef.current = new Audio()
            audioElRef.current.addEventListener("ended", () => stop())
          }
          audio = audioElRef.current
          // wawa-lipsync requires a valid src before connecting.
          audio.src = src
        } else {
          audio = src
          if (!audio.onended) audio.addEventListener("ended", () => stop())
          audioElRef.current = audio
        }

        analyser.connectAudio(audio)
        setStatus("speaking")
        startLoop()
        if (audio.paused) await audio.play()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not play audio")
        setStatus("error")
        stopLoop()
        setShape("rest")
      }
    },
    [ensureAnalyser, startLoop, stop, stopLoop],
  )

  const connectMic = useCallback(async () => {
    setError(null)
    try {
      const analyser = ensureAnalyser()
      await analyser.connectMicrophone()
      setStatus("listening")
      startLoop()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Microphone access was denied",
      )
      setStatus("error")
    }
  }, [ensureAnalyser, startLoop])

  useEffect(() => {
    return () => {
      stopLoop()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [stopLoop])

  return { shape, amplitude, status, error, connect, connectMic, stop }
}
