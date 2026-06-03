"use client"

import { type Ref, useEffect, useImperativeHandle } from "react"

import { Mouth } from "./mouth"
import type { LipShape } from "./lipsync"
import {
  type LipsyncStatus,
  type UseLipsyncOptions,
  useLipsync,
} from "./use-lipsync"

/** Imperative handle for driving the mouth yourself. */
export type TalkingMouthHandle = {
  /** Lip-sync a URL or an <audio> element. */
  play: (src: string | HTMLAudioElement) => Promise<void>
  /** Lip-sync the live microphone. */
  listen: () => Promise<void>
  /** Stop and close the mouth. */
  stop: () => void
}

type TalkingMouthProps = {
  /**
   * Audio to lip-sync — a URL or an <audio> element. Whenever this changes the
   * mouth (re)connects and plays. Omit it and drive the mouth imperatively via
   * the `ref` handle instead.
   */
  audio?: string | HTMLAudioElement
  scale?: number
  cavity?: string
  teeth?: string
  tongue?: string
  className?: string
  /** Forwarded to {@link useLipsync} (swap the analyser, tune the FFT, …). */
  options?: UseLipsyncOptions
  /** Observe every analysed frame — build your own meters/visuals on top. */
  onAnalysis?: (frame: { shape: LipShape; amplitude: number }) => void
  onStatusChange?: (status: LipsyncStatus) => void
  ref?: Ref<TalkingMouthHandle>
}

/**
 * Ready-to-use talking mouth: drop it over any illustration, hand it audio, and
 * it lip-syncs. Still fully observable via `onAnalysis` / `onStatusChange`, and
 * controllable via the `ref` handle. No TTS inside — you supply the audio.
 */
export function TalkingMouth({
  audio,
  scale,
  cavity,
  teeth,
  tongue,
  className,
  options,
  onAnalysis,
  onStatusChange,
  ref,
}: TalkingMouthProps) {
  const { shape, amplitude, status, connect, connectMic, stop } =
    useLipsync(options)

  useImperativeHandle(
    ref,
    () => ({ play: connect, listen: connectMic, stop }),
    [connect, connectMic, stop],
  )

  // Auto-connect when the `audio` prop changes.
  useEffect(() => {
    if (audio != null) void connect(audio)
  }, [audio, connect])

  useEffect(() => {
    onAnalysis?.({ shape, amplitude })
  }, [shape, amplitude, onAnalysis])

  useEffect(() => {
    onStatusChange?.(status)
  }, [status, onStatusChange])

  return (
    <Mouth
      shape={shape}
      scale={scale}
      cavity={cavity}
      teeth={teeth}
      tongue={tongue}
      className={className}
    />
  )
}
