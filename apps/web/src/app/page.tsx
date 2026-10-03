import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LifecycleRail } from "@/components/system/LifecycleRail";
import { PacketHero } from "@/components/system/PacketHero";
import { SiteFooter } from "@/components/system/SiteFooter";
import { WhyWeAsk } from "@/components/system/WhyWeAsk";
import { SHORT_DISCLAIMER } from "@/components/system/copy";
import { buttonVariants } from "@/components/ui/button";
import { isClerkConfigured } from "@/app/lib/runtimeConfig";
import { ClerkHomeActions } from "@/app/components/ClerkHomeActions";

const PACKET = [
  { title: "I-130", line: "Petition for a relative" },
  { title: "I-130A", line: "Spouse details with the I-130" },
  { title: "I-485", line: "Green card from inside the U.S." },
  { title: "I-864", line: "Affidavit of support" },
  { title: "I-765", line: "Work permit" },
  { title: "I-131", line: "Travel document" },
] as const;

export default function Home() {
  const clerk = isClerkConfigured();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <span className="type-title text-[1.75rem]">AOS</span>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-14 px-6 pb-16 md:px-10">
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-medium">Start free, no account needed</p>
            <h1 className="type-display max-w-3xl">
              Fill out your marriage green card forms, step by step
            </h1>
            <p className="max-w-xl text-lg leading-7">
              Answer one question at a time. AOS copies your answers into the official forms you choose.
            </p>
            <p className="type-title">
              $0 service fee +{" "}
              <Link href="/cost" className="underline decoration-foreground/30 underline-offset-4">
                USCIS fees
              </Link>
            </p>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Link href="/start" className={buttonVariants({ size: "cta" })}>
                Start filling out my forms
              </Link>
              <Link href="/demo" className="text-sm underline decoration-foreground/30 underline-offset-4">
                Explore the sample couple
              </Link>
            </div>
            {clerk ? <ClerkHomeActions /> : null}
            <p className="disclaimer max-w-xl">{SHORT_DISCLAIMER}</p>
          </div>
          <PacketHero />
        </section>

        <section className="space-y-4" aria-labelledby="path-heading">
          <h2 id="path-heading" className="text-sm font-medium">
            What you do
          </h2>
          <LifecycleRail current={null} />
        </section>

        <section className="space-y-3" aria-labelledby="packet-heading">
          <h2 id="packet-heading" className="text-sm font-medium">
            Forms this demo can prepare
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PACKET.map((form) => (
              <li key={form.title}>
                <div className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                  <span className="flex h-9 w-7 shrink-0 flex-col justify-between rounded-sm border border-foreground/20 bg-background px-1 py-1">
                    <span className="h-0.5 w-full bg-foreground/70" />
                    <span className="h-0.5 w-3/4 bg-foreground/40" />
                    <span className="h-0.5 w-full bg-foreground/25" />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{form.title}</span>
                    <span className="block text-xs leading-4 text-foreground/70">{form.line}</span>
                  </span>
                </div>
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
