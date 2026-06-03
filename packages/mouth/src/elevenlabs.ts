// @avatalk/mouth — ElevenLabs driver.
//
// The recommended way to make the mouth land *on* the words instead of trailing
// them. ElevenLabs' `/with-timestamps` endpoints return the synthesized audio
// alongside character-level timestamps; we turn those into a scheduled
// {@link ShapeCue} timeline and hand both to the `cues` driver (`playCues`).
//
// This is the only ElevenLabs-specific code in the package — the core mouth
// stays voice-agnostic. Bring any other timestamped source by building cues
// yourself (see {@link alignmentToCues} / the `ShapeCue` model).

import {
  type ElevenLabsAlignment,
  type ShapeCue,
  alignmentToCues,
} from "./lipsync"

/** The JSON shape ElevenLabs `/with-timestamps` returns. */
export type ElevenLabsResponse = {
  /** base64-encoded MP3. */
  audio_base64: string
  alignment: ElevenLabsAlignment | null
  /** Timestamps over the *normalized* text; used as a fallback. */
  normalized_alignment?: ElevenLabsAlignment | null
}

/** Ready-to-play speech: the audio element plus its scheduled mouth cues. */
export type ElevenLabsSpeech = {
  audio: HTMLAudioElement
  cues: ShapeCue[]
  alignment: ElevenLabsAlignment
}

/** Decode a base64 MP3 into a playable <audio> backed by an object URL. */
function base64Mp3ToAudio(base64: string): HTMLAudioElement {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }))
  const audio = new Audio(url)
  // Free the object URL once the clip finishes.
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true })
  return audio
}

/**
 * Turn a raw ElevenLabs `/with-timestamps` response into playable speech: an
 * <audio> element plus the {@link ShapeCue} timeline built from its character
 * alignment. Hand the result to `playCues(speech.audio, speech.cues)`.
 */
export function parseElevenLabs(res: ElevenLabsResponse): ElevenLabsSpeech {
  const alignment = res.alignment ?? res.normalized_alignment
  if (!alignment) {
    throw new Error(
      "ElevenLabs response has no timestamps — call a `/with-timestamps` endpoint.",
    )
  }
  return {
    audio: base64Mp3ToAudio(res.audio_base64),
    cues: alignmentToCues(alignment),
    alignment,
  }
}

/**
 * Fetch timestamped speech from your TTS endpoint and parse it into
 * {@link ElevenLabsSpeech}. `endpoint` is *your* server route that proxies
 * ElevenLabs (keep the API key server-side) and returns the
 * `/with-timestamps` JSON verbatim. `body` is whatever that route expects
 * (e.g. `{ text, voiceId }`).
 *
 *   const speech = await fetchElevenLabsSpeech("/api/tts", { text, voiceId })
 *   await voice.current.playCues(speech.audio, speech.cues)
 */
export async function fetchElevenLabsSpeech(
  endpoint: string,
  body: unknown,
  init?: RequestInit,
): Promise<ElevenLabsSpeech> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...init,
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || `TTS request failed (${res.status})`)
  }
  return parseElevenLabs((await res.json()) as ElevenLabsResponse)
}
