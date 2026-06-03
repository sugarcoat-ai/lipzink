import type { ReactNode } from "react"

/**
 * A stylised, single-weight line drawing of the Mona Lisa — proof that the
 * mouth drops onto *any* illustration, not just the bundled avatar. The mouth
 * area is intentionally left blank; pass a <TalkingMouth> via `mouth` and it
 * sits exactly where her smile would be.
 */
export function MonaLisa({
  mouth,
  className,
}: {
  mouth?: ReactNode
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 340,
        aspectRatio: "340 / 440",
        background: "linear-gradient(165deg,#efe6d0,#e3d4b3)",
        borderRadius: 16,
        boxShadow: "inset 0 0 0 1px rgba(58,51,38,0.12), 0 10px 30px -12px rgba(58,51,38,0.35)",
        overflow: "hidden",
      }}
    >
      <svg
        viewBox="0 0 340 440"
        fill="none"
        stroke="#3a3326"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        aria-hidden
      >
        {/* distant landscape, behind the figure */}
        <g stroke="#3a3326" strokeWidth={1.4} opacity={0.45}>
          <path d="M34,250 C64,236 92,240 112,250" />
          <path d="M34,280 C68,270 92,274 112,280" />
          <path d="M228,250 C252,240 282,236 312,250" />
          <path d="M228,280 C252,274 280,270 312,280" />
          <path d="M64,214 C82,224 98,224 112,218" />
          <path d="M232,218 C250,224 266,224 286,214" />
        </g>

        {/* veil / hair arching over the head and falling past the shoulders */}
        <path d="M84,200 C66,118 120,48 170,48 C220,48 274,118 256,200" />
        <path d="M118,150 C110,214 108,308 116,404" opacity={0.8} />
        <path d="M222,150 C230,214 232,308 224,404" opacity={0.8} />
        <path d="M122,176 C116,232 138,276 166,288" opacity={0.7} />
        <path d="M218,176 C224,232 202,276 174,288" opacity={0.7} />

        {/* shoulders / drapery */}
        <path d="M118,404 C118,330 144,300 170,300 C196,300 222,330 222,404" />
        <path d="M52,440 C60,378 92,352 126,346" />
        <path d="M288,440 C280,378 248,352 214,346" />
        <path d="M150,296 C150,318 190,318 190,296" opacity={0.6} />

        {/* face */}
        <path d="M120,172 C120,122 220,122 220,172 C220,232 196,278 170,278 C144,278 120,232 120,172 Z" />

        {/* eyes */}
        <path d="M138,176 C146,168 162,168 170,176 C162,184 146,184 138,176 Z" />
        <path d="M170,176 C178,168 194,168 202,176 C194,184 178,184 170,176 Z" />
        <circle cx="153" cy="177" r="3.4" fill="#3a3326" stroke="none" />
        <circle cx="187" cy="177" r="3.4" fill="#3a3326" stroke="none" />
        {/* faint brows */}
        <path d="M140,164 C150,160 162,160 170,164" strokeWidth={1.4} opacity={0.5} />
        <path d="M170,164 C178,160 190,160 200,164" strokeWidth={1.4} opacity={0.5} />

        {/* nose */}
        <path d="M170,182 C168,200 166,214 159,222 C166,228 178,228 184,221" />

        {/* folded hands, low in the frame */}
        <g opacity={0.9}>
          <path d="M138,398 C150,384 174,382 192,390 C212,398 232,396 246,410 C238,426 210,432 186,426 C164,420 138,418 138,398 Z" />
          <path d="M196,392 l7,17" strokeWidth={1.4} />
          <path d="M208,396 l6,15" strokeWidth={1.4} />
          <path d="M220,402 l4,12" strokeWidth={1.4} />
        </g>
      </svg>

      {/* soft varnish vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(120% 90% at 50% 35%, transparent 55%, rgba(58,51,38,0.18) 100%)",
        }}
      />

      {/* the mouth slot — sits where the smile would be */}
      {mouth && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "55.5%",
            transform: "translate(-50%,-50%)",
          }}
        >
          {mouth}
        </div>
      )}
    </div>
  )
}
