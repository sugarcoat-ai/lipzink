"use client"

import { ChevronLeft, ChevronRight, Shuffle, RotateCcw } from "lucide-react"

import { Avatar } from "@/components/avatar/avatar"
import { Button } from "@/components/ui/button"
import {
  AVATAR_CATEGORIES,
  type AvatarCategory,
  type AvatarConfig,
  DEFAULT_AVATAR,
  OPTIONAL_CATEGORIES,
  PART_COUNTS,
  cyclePart,
  randomAvatar,
} from "@/lib/avatar"
import { setAvatarConfig, useAvatarConfig } from "@/lib/use-avatar"

const LABELS: Record<AvatarCategory, string> = {
  face: "Face",
  hair: "Hair",
  eyes: "Eyes",
  eyebrows: "Eyebrows",
  nose: "Nose",
  glasses: "Glasses",
  beard: "Beard",
  accessories: "Accessories",
  details: "Details",
  mouth: "Mouth",
}

function currentLabel(config: AvatarConfig, cat: AvatarCategory) {
  const v = config[cat]
  if (v === null) return "None"
  return `${v + 1} / ${PART_COUNTS[cat]}`
}

export default function MakerPage() {
  // localStorage is the source of truth; edits persist immediately.
  const config = useAvatarConfig()

  return (
    <main className="mx-auto grid max-w-4xl gap-10 px-6 py-10 md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-4">
        <Avatar
          config={config}
          size={280}
          background="#f5f1ea"
          className="shadow-sm ring-1 ring-black/5"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAvatarConfig(randomAvatar())}
          >
            <Shuffle className="size-4" /> Randomize
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAvatarConfig(DEFAULT_AVATAR)}
          >
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">Avatar Maker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cycle through each part. Selection is saved automatically.
        </p>

        <div className="mt-6 divide-y rounded-xl border">
          {AVATAR_CATEGORIES.map((cat) => (
            <div
              key={cat}
              className="flex items-center justify-between gap-4 px-4 py-2.5"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium">{LABELS[cat]}</div>
                <div className="text-xs text-muted-foreground">
                  {currentLabel(config, cat)}
                  {OPTIONAL_CATEGORIES.includes(cat) ? " · optional" : ""}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Previous ${LABELS[cat]}`}
                  onClick={() => setAvatarConfig(cyclePart(config, cat, -1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Next ${LABELS[cat]}`}
                  onClick={() => setAvatarConfig(cyclePart(config, cat, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
