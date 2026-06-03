import { Mouth, type LipShape } from "@lipzink/mouth"

import { AvatarCanvas } from "./avatar-canvas"
import { type AvatarConfig, MOUTH_CENTER } from "./avatar-model"

type TalkingAvatarProps = {
  config: AvatarConfig
  shape: LipShape
  /** 0..1 loudness; subtly scales the mouth so louder speech opens wider. */
  amplitude?: number
  size?: number
  background?: string
  className?: string
}

// Mouth anchor as a fraction of the 1080 canvas.
const ANCHOR_X = `${(MOUTH_CENTER.x / 1080) * 100}%`
const ANCHOR_Y = `${(MOUTH_CENTER.y / 1080) * 100}%`

/**
 * The notion-style avatar with the animated lip-sync mouth overlaid at the
 * mouth position, replacing the static mouth part.
 */
export function TalkingAvatar({
  config,
  shape,
  amplitude = 0,
  size = 256,
  background = "#f5f1ea",
  className,
}: TalkingAvatarProps) {
  // Base mouth (~80px) scaled so it spans ~12% of the avatar, plus a small
  // amplitude-driven boost for liveliness.
  const baseScale = (size * 0.12) / 80
  const scale = baseScale * (0.9 + amplitude * 0.45)

  return (
    <AvatarCanvas
      config={config}
      size={size}
      background={background}
      className={className}
      mouthSlot={
        <div
          className="absolute"
          style={{
            left: ANCHOR_X,
            top: ANCHOR_Y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Mouth shape={shape} scale={scale} />
        </div>
      }
    />
  )
}
