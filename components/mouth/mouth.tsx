import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import type { LipShape } from "./lipsync";
import styles from "./mouth.module.css";

type MouthProps = {
  /** Current phoneme group / mouth shape. */
  shape: LipShape;
  /**
   * Uniform scale of the CSS mouth. The base mouth is ~80px wide, so a scale of
   * 1 renders at that size; use larger values for the standalone demo and
   * smaller values when overlaying the avatar.
   */
  scale?: number;
  /** Cavity colour (defaults to near-black). */
  cavity?: string;
  /** Teeth colour (defaults to white). */
  teeth?: string;
  /** Tongue colour (defaults to mid-grey). */
  tongue?: string;
  className?: string;
};

/**
 * Black & white CSS lip-sync mouth (fork of LipSync.js). Switching `shape`
 * animates the mouth between phoneme groups via CSS transitions.
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
  } as CSSProperties;

  return (
    <div
      className={cn(styles.mouth, className)}
      data-letters={shape}
      style={style}
      aria-hidden
    >
      <div className={cn(styles.tongue, styles.left)} />
      <div className={cn(styles.tongue, styles.right)} />
      <div className={cn(styles.teeth, styles.upper)} />
      <div className={cn(styles.teeth, styles.lower)} />
    </div>
  );
}
