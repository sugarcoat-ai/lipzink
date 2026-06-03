import type { CSSProperties } from "react"

import "./mouth.css"
import type { LipShape } from "./lipsync"

type MouthProps = {
  /** Current phoneme group / mouth shape. */
  shape: LipShape
  /**
   * Uniform scale of the CSS mouth. The base mouth is ~80px wide, so a scale of
   * 1 renders at that size; use larger values for a standalone demo and smaller
   * values when overlaying an avatar.
   */
  scale?: number
  /** Cavity colour (defaults to near-black). */
  cavity?: string
  /** Teeth colour (defaults to white). */
  teeth?: string
  /** Tongue colour (defaults to mid-grey). */
  tongue?: string
  className?: string
}

/** Tiny classnames join (avoids pulling in clsx/tailwind-merge). */
function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ")
}

/**
 * Black & white CSS lip-sync mouth (fork of LipSync.js). Switching `shape`
 * animates the mouth between phoneme groups via CSS transitions. It's pure
 * presentation — position it absolutely over any illustration you like.
 *
 * Styles ship in `@lipzink/mouth/styles.css` (auto-included here for bundlers
 * that follow the side-effect import).
 */
export function Mouth({
  shape,
  scale = 1,
  cavity,
  teeth,
  tongue,
  className,
}: MouthProps) {
  const style = {
    "--ls-scale": scale,
    ...(cavity ? { "--ls-cavity": cavity } : {}),
    ...(teeth ? { "--ls-teeth": teeth } : {}),
    ...(tongue ? { "--ls-tongue": tongue } : {}),
  } as CSSProperties

  return (
    <div
      className={cx("lipzink-mouth", className)}
      data-letters={shape}
      style={style}
      aria-hidden
    >
      <div className="lipzink-mouth__tongue lipzink-mouth__tongue--left" />
      <div className="lipzink-mouth__tongue lipzink-mouth__tongue--right" />
      <div className="lipzink-mouth__teeth lipzink-mouth__teeth--upper" />
      <div className="lipzink-mouth__teeth lipzink-mouth__teeth--lower" />
    </div>
  )
}
