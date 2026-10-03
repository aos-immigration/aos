import Link from "next/link";
import { Disclaimer } from "./Disclaimer";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-8 md:px-10">
      <Disclaimer className="max-w-3xl" />
      <p className="mt-3 text-sm leading-6">
        Official forms are free at{" "}
        <a
          className="underline decoration-foreground/40 underline-offset-4"
          href="https://www.uscis.gov/forms"
        >
          uscis.gov
        </a>
        . <Link className="underline decoration-foreground/40 underline-offset-4" href="/terms">Terms</Link>
        {" · "}
        <Link className="underline decoration-foreground/40 underline-offset-4" href="/privacy">Privacy</Link>
      </p>
    </footer>
  );
}
