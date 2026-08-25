import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">AdviceIT by Radit</p>
          <p>A research instrument for explainable AI in financial advice. Nothing here is real financial advice.</p>
          <p>
            Raditya Pratama · MIT licence ·{" "}
            <a className="underline underline-offset-4 hover:text-foreground" href="https://github.com/Raditya-P/AdviceIT" target="_blank" rel="noopener">
              GitHub
            </a>{" "}
            ·{" "}
            <Link className="underline underline-offset-4 hover:text-foreground" href="/privacy">
              Privacy and consent
            </Link>
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/researcher">Researcher mode</Link>
        </Button>
      </div>
    </footer>
  );
}
