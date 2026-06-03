import Link from "next/link"

const CARDS = [
  {
    href: "/maker",
    title: "1 · Avatar Maker",
    body: "Compose a notion-style avatar by cycling each part — face, hair, eyes, glasses, beard and more.",
  },
  {
    href: "/mouth",
    title: "2 · Phoneme Mouth",
    body: "A black & white CSS lip-sync mouth that morphs between phoneme shapes with animated transitions.",
  },
  {
    href: "/talk",
    title: "3 · Talk (ElevenLabs)",
    body: "Type text, synthesize speech with ElevenLabs, and drive the mouth from a live FFT audio analyser.",
  },
]

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">avatalk</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        A notion-style avatar with a special animated mouth and eyes that
        simulate voice — built for talking user interfaces.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border p-5 transition-colors hover:bg-accent"
          >
            <h2 className="font-medium">{c.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            <span className="mt-3 inline-block text-sm text-foreground/70 group-hover:translate-x-0.5">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
