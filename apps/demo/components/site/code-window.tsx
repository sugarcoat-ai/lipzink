"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"

export type CodeTab = {
  /** Tab label, e.g. "With ElevenLabs". */
  label: string
  /** File name shown in the window chrome, e.g. "app/page.tsx". */
  file?: string
  code: string
}

/**
 * A polished, dark "editor window" for code samples: traffic-light chrome,
 * optional file name, optional tabs, and a copy button that flips to a check.
 * Reads well in both light and dark site themes.
 */
export function CodeWindow({
  tabs,
  className,
}: {
  tabs: CodeTab[]
  className?: string
}) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const tab = tabs[active] ?? tabs[0]

  function copy() {
    void navigator.clipboard?.writeText(tab.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/20",
        className,
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>

        {tabs.length > 1 ? (
          <div className="flex items-center gap-1">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors",
                  i === active
                    ? "bg-white/10 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          tab.file && (
            <span className="font-mono text-[11px] text-zinc-500">{tab.file}</span>
          )
        )}

        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-zinc-400 transition-colors hover:bg-white/10 hover:text-zinc-100"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {tabs.length > 1 && tab.file && (
        <div className="border-b border-white/5 px-4 py-1.5 font-mono text-[10px] text-zinc-600">
          {tab.file}
        </div>
      )}

      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-zinc-200 sm:p-5">
        <code>{tab.code}</code>
      </pre>
    </div>
  )
}
