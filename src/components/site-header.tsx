import Link from "next/link";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/advisor/ml", label: "AI advisor" },
  { href: "/advisor/logit", label: "Interpretable advisor" },
  { href: "/training-data", label: "Training data" },
  { href: "/references", label: "References" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            A
          </span>
          AdviceIT
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">by Radit</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <Button asChild size="sm">
          <Link href="/participate">Participate</Link>
        </Button>
      </div>
    </header>
  );
}
