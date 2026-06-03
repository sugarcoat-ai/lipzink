"use client"

import { type Ref, useEffect, useImperativeHandle } from "react"
import {
  type LipShape,
  type LipsyncStatus,
  type ShapeCue,
  useLipsync,
} from "@avatalk/mouth"

import { TalkingAvatar } from "./talking-avatar"
import type { AvatarConfig } from "./avatar-model"

/**
 * Imperative voice handle exposed via `ref`. Grab it to make the avatar talk:
 *
 *   const voice = useRef<AvatarVoiceHandle>(null)
 *   <Avatar spec={spec} ref={voice} />
 *   voice.current?.playAudio(myTtsUrl)
 *
 * Note there's no `speak()` here: the avatar is voice-agnostic. Synthesize
 * speech however you like (ElevenLabs, OpenAI, a recording) and hand the audio
 * to `playAudio`. See the demo app's `/api/tts` route for an example.
 */
export type AvatarVoiceHandle = {
  /**
   * Drive the mouth by analysing any audio you supply — a URL or your own
   * <audio>. Reactive: good for recordings or TTS without timing data.
   */
  playAudio: (src: string | HTMLAudioElement) => Promise<void>
  /**
   * Drive the mouth from a scheduled cue timeline (e.g. ElevenLabs timestamps
   * via `fetchElevenLabsSpeech`). The mouth lands on each phoneme on time
   * rather than trailing the audio — the recommended path when you have timing.
   */
  playCues: (src: string | HTMLAudioElement, cues: ShapeCue[]) => Promise<void>
  /** Drive the mouth from the live microphone. */
  startMic: () => Promise<void>
  /** Stop playback / listening and close the mouth. */
  stop: () => void
}

type AvatarProps = {
  /** The avatar spec (the JSON the maker exports). */
  spec: AvatarConfig
  size?: number
  background?: string
  className?: string
  /**
   * Force the mouth into a specific shape, overriding the audio-driven one.
   * Handy for previewing visemes or driving the mouth from your own viseme
   * events (map them with `azureVisemeToShape` etc.). Leave undefined to let
   * the connected audio drive it.
   */
  shape?: LipShape
  /** Imperative voice handle — call `.playAudio()` / `.startMic()` on it. */
  ref?: Ref<AvatarVoiceHandle>
  /** Notified whenever the talking status changes (idle/speaking/listening…). */
  onStatusChange?: (status: LipsyncStatus) => void
}

/**
 * The avatar as a drop-in React component: pass a `spec` to render it, and use
 * the `ref` voice handle to feed it audio. The lip-sync mouth is driven
 * internally (via `@avatalk/mouth`) — you don't wire up shapes or analysers.
 */
export function Avatar({
  spec,
  size,
  background,
  className,
  shape,
  ref,
  onStatusChange,
}: AvatarProps) {
  const lip = useLipsync()

  useImperativeHandle(
    ref,
    () => ({
      playAudio: lip.connect,
      playCues: lip.playCues,
      startMic: lip.connectMic,
      stop: lip.stop,
    }),
    [lip.connect, lip.playCues, lip.connectMic, lip.stop],
  )

  useEffect(() => {
    onStatusChange?.(lip.status)
  }, [lip.status, onStatusChange])

  // A provided `shape` overrides the audio-driven one (e.g. viseme preview).
  return (
    <TalkingAvatar
      config={spec}
      shape={shape ?? lip.shape}
      amplitude={lip.amplitude}
      size={size}
      background={background}
      className={className}
    />
  )
}
