// @lipzink/avatar — a notion-style avatar with a built-in lip-sync mouth. Ships
// its own art (bundled SVGs), depends on @lipzink/mouth for the talking mouth,
// and is voice-agnostic: feed it audio, no TTS baked in.

export { Avatar } from "./avatar"
export type { AvatarVoiceHandle } from "./avatar"
export { AvatarCanvas } from "./avatar-canvas"
export { TalkingAvatar } from "./talking-avatar"

// The avatar spec model + helpers (build pickers, randomize, etc.).
export {
  AVATAR_CATEGORIES,
  AVATAR_FRAME,
  DEFAULT_AVATAR,
  LAYER_ORDER,
  MOUTH_CENTER,
  OPTIONAL_CATEGORIES,
  PART_COUNTS,
  PART_FRAME,
  cyclePart,
  partFrame,
  partSrc,
  randomAvatar,
} from "./avatar-model"
export type { AvatarCategory, AvatarConfig, PartFrame } from "./avatar-model"
