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
} from "./lipsync"
export type { LipShape } from "./lipsync"
