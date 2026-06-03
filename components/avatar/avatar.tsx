import type { CSSProperties, ReactNode } from "react";

import {
  AVATAR_FRAME,
  type AvatarConfig,
  LAYER_ORDER,
  partSrc,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

type AvatarProps = {
  config: AvatarConfig;
  /** Pixel size of the (square) avatar. */
  size?: number;
  /** Background fill behind the line art (a circle). */
  background?: string;
  /** Render as a circle (default) or square. */
  shape?: "circle" | "square";
  /**
   * Replace the static mouth layer with a custom node (e.g. the animated
   * lip-sync mouth). The node is positioned over the full 1080 canvas.
   */
  mouthSlot?: ReactNode;
  /** Periodically blink the eyes (default true). */
  blink?: boolean;
  className?: string;
};

/**
 * Composites the selected notion-style avatar parts as stacked, full-canvas
 * SVG layers. Each part is transparent line art, so layering at the same size
 * reproduces the original composition.
 */
export function Avatar({
  config,
  size = 256,
  background = "#ffffff",
  shape = "circle",
  mouthSlot,
  blink = true,
  className,
}: AvatarProps) {
  // The notion-avatar parts aren't centered in the 1080 canvas, so recenter on
  // the measured content bounding box and scale it down to fit fully inside the
  // (circular) frame. transform-origin is the top-left so the maths is simple.
  const { cx, cy, scale } = AVATAR_FRAME;
  const frameStyle: CSSProperties = {
    transformOrigin: "0 0",
    transform: `translate(${(0.5 - cx * scale) * 100}%, ${
      (0.5 - cy * scale) * 100
    }%) scale(${scale})`,
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        shape === "circle" ? "rounded-full" : "rounded-3xl",
        className,
      )}
      style={{ width: size, height: size, background }}
    >
      <div className="absolute inset-0" style={frameStyle}>
        {LAYER_ORDER.map((category) => {
          if (category === "mouth" && mouthSlot) {
            return (
              <div key="mouth-slot" className="absolute inset-0">
                {mouthSlot}
              </div>
            );
          }
          const index = config[category];
          if (index === null || index === undefined) return null;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={category}
              src={partSrc(category, index)}
              alt=""
              aria-hidden
              draggable={false}
              className={cn(
                "pointer-events-none absolute inset-0 h-full w-full select-none",
                blink && category === "eyes" && "avatalk-eyes-blink",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
