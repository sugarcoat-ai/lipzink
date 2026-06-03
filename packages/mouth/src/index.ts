// @avatalk/mouth — a black & white CSS lip-sync mouth you can drop onto any
// illustration, driven by any audio you supply. No avatar, no assets, no TTS.

export { Mouth } from "./mouth"
export { TalkingMouth } from "./talking-mouth"
export type { TalkingMouthHandle } from "./talking-mouth"

// The audio → mouth seam.
export {
  useLipsync,
  WawaAnalyser,
} from "./use-lipsync"
export type {
  LipsyncAnalyser,
  LipsyncFrame,
  LipsyncStatus,
  UseLipsyncOptions,
  UseLipsyncReturn,
  WawaOptions,
} from "./use-lipsync"

// The shape model + mappings — drive the mouth from text or TTS viseme events
// (e.g. Azure) without touching audio analysis.
export {
  LIP_SHAPES,
  LIP_SHAPE_LABELS,
  charToShape,
  textToShapes,
  azureVisemeToShape,
  wawaVisemeToShape,
  audioToShape,
  cuesAt,
  alignmentToCues,
} from "./lipsync"
export type { LipShape, ShapeCue, ElevenLabsAlignment } from "./lipsync"

// ElevenLabs driver — fetch `/with-timestamps` speech and turn it into a
// scheduled cue timeline (the recommended, on-time lip-sync path).
export {
  parseElevenLabs,
  fetchElevenLabsSpeech,
} from "./elevenlabs"
export type {
  ElevenLabsResponse,
  ElevenLabsSpeech,
} from "./elevenlabs"
