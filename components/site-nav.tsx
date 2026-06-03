import Link from "next/link";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/maker", label: "Avatar Maker" },
  { href: "/mouth", label: "Phoneme Mouth" },
  { href: "/talk", label: "Talk (TTS)" },
];

export function SiteNav() {
  return (
    <nav className="flex items-center gap-1 border-b px-4 py-2 text-sm">
      <span className="mr-3 font-semibold tracking-tight">avatalk</span>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
