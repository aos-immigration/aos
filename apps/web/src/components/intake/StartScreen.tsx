import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const TOPICS = [
  "You entered the U.S. without being inspected by an immigration officer (for example, crossed the border without going through a port of entry), or you're not sure how you entered.",
  "You were ever ordered removed, deported, or excluded, or you left the U.S. while a removal case was open.",
  "You are now, or ever were, in immigration court proceedings.",
  "You were ever arrested, cited, charged, or convicted of any crime or offense anywhere in the world, even if it was dismissed, expunged, or happened when you were a minor.",
  "You stayed in the U.S. past the date on your I-94 or visa, or worked without authorization, and your spouse is not a U.S. citizen (for example, a green card holder).",
  "You have spent time in the U.S. without lawful status, especially more than 180 days, and then left the country.",
  "USCIS or another agency ever found, or accused you of, fraud or lying to get an immigration benefit, or of a fake marriage.",
  "You ever claimed to be a U.S. citizen when you weren't (including on a job form or a voter registration).",
  "Either of you has a prior marriage that may not have been legally ended, or a prior petition for a different spouse.",
  "You were ever denied a visa or green card, or had a petition denied or revoked.",
  "You entered on a K-1 fiancé(e) visa and married someone other than the person who petitioned for you, or you entered on a J-1 visa with a two-year home-residence requirement.",
  "You have certain health conditions, drug-related history, or immigration violations that USCIS lists as possible grounds of inadmissibility.",
  "Your spouse (the petitioner) became a U.S. citizen or permanent resident through a prior marriage within the last 5 years.",
  "You married the petitioner while you were in immigration court (removal) proceedings.",
] as const;

export function StartScreen() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="type-title">Talk to an attorney before filing if any of these apply</h1>
        <p className="mt-3 text-sm leading-6">
          AOS can&apos;t tell you whether you qualify for a green card, and this list doesn&apos;t decide that either. These are situations where the law is complicated and a licensed immigration attorney or a DOJ-accredited representative can help. If any of them apply to you or your spouse, or if you&apos;re not sure, please get legal advice before you file.
        </p>
      </div>
      <ul className="space-y-3 text-sm leading-6">
        {TOPICS.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <div>
        <h2 className="text-sm font-medium">Where to find help</h2>
        <ul className="mt-3 space-y-3 text-sm leading-6">
          <li>
            Lawyers: your state bar&apos;s lawyer-referral service, or the AILA lawyer search at{" "}
            <a className="underline decoration-foreground/30 underline-offset-4" href="https://www.ailalawyer.com">
              ailalawyer.com
            </a>
            .
          </li>
          <li>
            Free or low-cost help: DOJ-recognized organizations and accredited representatives at{" "}
            <a
              className="underline decoration-foreground/30 underline-offset-4"
              href="https://www.justice.gov/eoir/recognized-organizations-and-accredited-representatives-roster-state-and-city"
            >
              justice.gov/eoir/recognized-organizations-and-accredited-representatives-roster-state-and-city
            </a>
            .
          </li>
          <li>
            Avoid scams: see USCIS&apos;s guidance at{" "}
            <a className="underline decoration-foreground/30 underline-offset-4" href="https://www.uscis.gov/avoid-scams">
              uscis.gov/avoid-scams
            </a>
            . In the U.S., a &quot;notario&quot; or notary public is not a lawyer and cannot give legal advice.
          </li>
        </ul>
      </div>
      <div className="flex flex-col items-start gap-3">
        <Link href="/sections" className={buttonVariants({ size: "cta" })}>
          Back to my forms
        </Link>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/cost" className="underline decoration-foreground/30 underline-offset-4">
            USCIS fees
          </Link>
          <Link href="/sections/documents" className="underline decoration-foreground/30 underline-offset-4">
            Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
