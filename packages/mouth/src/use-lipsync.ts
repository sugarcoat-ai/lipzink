"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Lipsync } from "wawa-lipsync"

import {
  cuesAt,
  type LipShape,
  type ShapeCue,
  wawaVisemeToShape,
} from "./lipsync"

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
      // wawa's `volume` is already normalised to 0..1 (mean of per-band values,
      // each /255), so it just needs clamping — the old `/100` pinned it to ~0.
      amplitude: Math.min(1, this.manager.features?.volume ?? 0),
    }
  }
}

/**
 * A tiny loudness probe used by the scheduled `cues` driver: cues decide the
 * mouth *shape* from timestamps, but we still measure real playback loudness so
 * the mouth can open a touch wider on louder speech. It owns its own
 * AudioContext + AnalyserNode and (like wawa) routes the element to the speakers
 * so audio stays audible while we read it.
 */
class LoudnessMeter {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private data: Uint8Array<ArrayBuffer> | null = null
  private source: MediaElementAudioSourceNode | null = null
  private el: HTMLAudioElement | null = null

  /** Route `el` through the meter. A no-op if it's already attached. */
  attach(el: HTMLAudioElement): void {
    if (this.el === el) {
      void this.ctx?.resume()
      return
    }
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      this.ctx = new Ctor()
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 1024
      this.data = new Uint8Array(this.analyser.frequencyBinCount)
    }
    // A media element can only feed one source node; swap to the new element.
    this.source?.disconnect()
    this.source = this.ctx.createMediaElementSource(el)
    this.source.connect(this.analyser!)
    this.analyser!.connect(this.ctx.destination)
    this.el = el
    void this.ctx.resume()
  }

  /** Current loudness, 0..1. Returns 0 if nothing is attached. */
  level(): number {
    if (!this.analyser || !this.data) return 0
    this.analyser.getByteFrequencyData(this.data)
    let sum = 0
    for (let i = 0; i < this.data.length; i++) sum += this.data[i]
    // Mean bin energy, lifted a little so normal speech reads as lively.
    return Math.min(1, (sum / this.data.length / 255) * 2.5)
  }
}

export type UseLipsyncOptions = WawaOptions & {
  /** Swap in your own detector. Defaults to {@link WawaAnalyser}. */
  analyser?: LipsyncAnalyser
  /**
   * Lead time (seconds) applied in the scheduled `cues` driver: the mouth reads
   * the timeline at `currentTime + lookahead`, so the CSS morph *starts* just
   * before the phoneme is heard and lands on time. Defaults to 0.05s. Bump it
   * if the mouth still feels late; drop it toward 0 for strict alignment.
   */
  lookahead?: number
}

export type UseLipsyncReturn = {
  /** Current phoneme group — feed this straight to <Mouth shape>. */
  shape: LipShape
  /** 0..1 loudness; handy for scaling the mouth so louder speech opens wider. */
  amplitude: number
  status: LipsyncStatus
  error: string | null
  /**
   * **Analyser driver.** Drive the mouth by analysing whatever audio you supply
   * — a URL (we create the <audio>) or your own <audio> element. Reactive: the
   * mouth follows the sound it hears, so it necessarily trails a little. Use it
   * when you have audio but no timing data (a recording, a non-timestamped TTS).
   */
  connect: (src: string | HTMLAudioElement) => Promise<void>
  /**
   * **Cues driver.** Drive the mouth from a pre-built {@link ShapeCue} timeline
   * scheduled against the audio clock — the mouth lands *on* each phoneme
   * instead of trailing it. This is the voice-agnostic seam for any source that
   * knows speech timing: ElevenLabs timestamps (see `alignmentToCues`), Azure
   * viseme events, a forced aligner. Pass the audio plus its cues.
   */
  playCues: (src: string | HTMLAudioElement, cues: ShapeCue[]) => Promise<void>
  /** Drive the mouth from the live microphone (analyser driver). */
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
  // Which driver the animation loop is currently running.
  const modeRef = useRef<"analyser" | "cues">("analyser")
  // Scheduled-cue state (only used in "cues" mode).
  const cuesRef = useRef<ShapeCue[]>([])
  const meterRef = useRef<LoudnessMeter | null>(null)

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
    const lookahead = optionsRef.current.lookahead ?? 0.05
    const tick = () => {
      if (modeRef.current === "cues") {
        // Scheduled driver: shape comes from the timeline at the (look-ahead)
        // audio clock; loudness is still measured so the mouth opens wider on
        // louder speech. setState bails when the shape is unchanged.
        const audio = audioElRef.current
        const t = (audio?.currentTime ?? 0) + lookahead
        setShape(cuesAt(cuesRef.current, t))
        setAmplitude(meterRef.current?.level() ?? 0)
      } else {
        const analyser = analyserRef.current
        if (analyser) {
          const frame = analyser.analyze()
          setShape(frame.shape)
          setAmplitude(frame.amplitude)
        }
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
        modeRef.current = "analyser"
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

  const playCues = useCallback(
    async (src: string | HTMLAudioElement, cues: ShapeCue[]) => {
      setError(null)
      try {
        modeRef.current = "cues"
        cuesRef.current = cues

        // Resolve the audio element (reuse our own for URLs; adopt yours as-is).
        let audio: HTMLAudioElement
        if (typeof src === "string") {
          if (!audioElRef.current) {
            audioElRef.current = new Audio()
            audioElRef.current.addEventListener("ended", () => stop())
          }
          audio = audioElRef.current
          audio.src = src
        } else {
          audio = src
          if (!audio.onended) audio.addEventListener("ended", () => stop())
          audioElRef.current = audio
        }

        // Measure loudness for the amplitude meter. If the audio graph can't be
        // built (e.g. the element is already wired elsewhere), fall back to a
        // flat amplitude rather than failing the whole playback.
        try {
          if (!meterRef.current) meterRef.current = new LoudnessMeter()
          meterRef.current.attach(audio)
        } catch {
          meterRef.current = null
        }

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
    [startLoop, stop, stopLoop],
  )

  const connectMic = useCallback(async () => {
    setError(null)
    try {
      modeRef.current = "analyser"
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

  return { shape, amplitude, status, error, connect, playCues, connectMic, stop }
}
