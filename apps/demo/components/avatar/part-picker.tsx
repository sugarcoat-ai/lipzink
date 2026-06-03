"use client"

import type { CSSProperties } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import {
  type AvatarCategory,
  type AvatarConfig,
  OPTIONAL_CATEGORIES,
  PART_COUNTS,
  type PartFrame,
  cyclePart,
  partFrame,
  partSrc,
} from "@avatalk/avatar"
import { setAvatarConfig } from "@/lib/use-avatar"
import { cn } from "@/lib/utils"

const LABELS: Record<AvatarCategory, string> = {
  face: "Head",
  hair: "Hair",
  eyes: "Eyes",
  eyebrows: "Brows",
  nose: "Nose",
  glasses: "Glasses",
  beard: "Beard",
  accessories: "Accessory",
  details: "Details",
  mouth: "Mouth",
}

// Zoom the thumbnail right onto the part's own bounding box (centre + scale
// measured at build time) so each shape is as large as it can be in the circle.
function frameStyle({ cx, cy, scale }: PartFrame): CSSProperties {
  return {
    transformOrigin: "0 0",
    transform: `translate(${(0.5 - cx * scale) * 100}%, ${
      (0.5 - cy * scale) * 100
    }%) scale(${scale})`,
  }
}

/** One circular option thumbnail showing a single part (or an empty slot). */
function PartThumb({
  category,
  index,
  selected,
  onSelect,
}: {
  category: AvatarCategory
  index: number | null
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={
        index === null ? `No ${LABELS[category]}` : `${LABELS[category]} ${index + 1}`
      }
      className={cn(
        "relative size-14 shrink-0 overflow-hidden rounded-full border bg-background transition-all",
        "hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected
          ? "border-foreground ring-2 ring-foreground/15"
          : "border-border",
      )}
    >
      {index === null ? (
        <span className="text-muted-foreground/60 text-lg leading-none">∅</span>
      ) : (
        <div className="absolute inset-0" style={frameStyle(partFrame(category, index))}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={partSrc(category, index)}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
          />
        </div>
      )}
    </button>
  )
}

/**
 * A horizontal carousel of option thumbnails for one avatar category, with
 * prev/next arrows that cycle the selection. Writes straight to the persisted
 * avatar store. `align` tilts the label row toward the avatar in the centre.
 */
export function PartCarousel({
  category,
  config,
  align = "left",
}: {
  category: AvatarCategory
  config: AvatarConfig
  align?: "left" | "right"
}) {
  const optional = OPTIONAL_CATEGORIES.includes(category)
  const slots: (number | null)[] = optional ? [null] : []
  for (let i = 0; i < PART_COUNTS[category]; i++) slots.push(i)

  const current = config[category]

  return (
    <div className={cn("flex flex-col gap-1.5", align === "right" && "items-end")}>
      <div
        className={cn(
          "flex w-full items-center gap-1.5",
          align === "right" && "flex-row-reverse",
        )}
      >
        <span className="font-mono text-xs tracking-tight">{LABELS[category]}</span>
        <span className="text-muted-foreground/70 font-mono text-[10px]">
          {current === null ? "off" : `${current + 1}/${PART_COUNTS[category]}`}
        </span>
        <button
          type="button"
          aria-label={`Previous ${LABELS[category]}`}
          onClick={() => setAvatarConfig(cyclePart(config, category, -1))}
          className="text-muted-foreground hover:text-foreground ml-auto rounded p-0.5 transition-colors"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Next ${LABELS[category]}`}
          onClick={() => setAvatarConfig(cyclePart(config, category, 1))}
          className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>

      <div
        className={cn(
          "flex max-w-full gap-2 overflow-x-auto pb-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          align === "right" && "flex-row-reverse",
        )}
      >
        {slots.map((slot) => (
          <PartThumb
            key={slot === null ? "none" : slot}
            category={category}
            index={slot}
            selected={slot === current}
            onSelect={() => setAvatarConfig({ ...config, [category]: slot })}
          />
        ))}
      </div>
    </div>
  )
}
