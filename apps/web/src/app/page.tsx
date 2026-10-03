import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChoiceCard } from "@/components/system/ChoiceCard";
import { LifecycleRail } from "@/components/system/LifecycleRail";
import { SiteFooter } from "@/components/system/SiteFooter";
import { WhyWeAsk } from "@/components/system/WhyWeAsk";
import { Disclaimer } from "@/components/system/Disclaimer";
import { buttonVariants } from "@/components/ui/button";
import { isClerkConfigured } from "@/app/lib/runtimeConfig";
import { ClerkHomeActions } from "@/app/components/ClerkHomeActions";

const PACKET = [
  {
    title: "I-130",
    definition: "A citizen or resident asks USCIS to recognize a relative.",
    href: "https://www.uscis.gov/i-130",
  },
  {
    title: "I-130A",
    definition: "Extra spouse details filed with an I-130.",
    href: "https://www.uscis.gov/i-130",
  },
  {
    title: "I-485",
    definition: "Apply for a green card from inside the United States.",
    href: "https://www.uscis.gov/i-485",
  },
  {
    title: "I-864",
    definition: "A sponsor's affidavit of support.",
    href: "https://www.uscis.gov/i-864",
  },
  {
    title: "I-765",
    definition: "Ask for a work permit.",
    href: "https://www.uscis.gov/i-765",
  },
  {
    title: "I-131",
    definition: "Ask for a travel document, such as advance parole.",
    href: "https://www.uscis.gov/i-131",
  },
] as const;

export default function Home() {
  const clerk = isClerkConfigured();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <span className="type-title text-[1.75rem]">AOS</span>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 pb-16 md:px-10">
        <section className="flex flex-col gap-6">
          <p className="text-sm font-medium">Start free, no account needed</p>
          <h1 className="type-display max-w-3xl">
            Fill out your marriage green card forms, step by step
          </h1>
          <p className="max-w-xl text-lg leading-7">
            Answer plain-language questions. AOS copies them into the official forms you choose.
          </p>
          <p className="type-title">$0 service fee + USCIS fees</p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link href="/demo" className={buttonVariants({ size: "cta" })}>
              Start filling out my forms
            </Link>
            <p className="text-sm">Automatic cross-form checks. You review and file.</p>
          </div>
          {clerk ? (
            <ClerkHomeActions />
          ) : (
            <p className="max-w-xl text-sm">
              Auth is not configured. Sign-in is unavailable until Clerk keys are set. The demo couple is fake and nothing is saved.
            </p>
          )}
          <Disclaimer className="max-w-2xl" />
        </section>

        <section className="space-y-4" aria-labelledby="path-heading">
          <h2 id="path-heading" className="text-sm font-medium">
            What you do
          </h2>
          <LifecycleRail current={null} />
        </section>

        <section className="space-y-4" aria-labelledby="packet-heading">
          <h2 id="packet-heading" className="text-sm font-medium">
            Forms this demo can prepare
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {PACKET.map((form) => (
              <li key={form.title}>
                <ChoiceCard
                  title={form.title}
                  definition={form.definition}
                  href={form.href}
                />
              </li>
            ))}
          </ul>
        </section>

        <WhyWeAsk label="How AOS works">
          You choose the forms and every answer. AOS copies those answers into the PDFs. You review them, sign them, and file them yourself.
        </WhyWeAsk>
      </main>
      <SiteFooter />
    </div>
  );
}
