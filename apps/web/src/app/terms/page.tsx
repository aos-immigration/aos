import Link from "next/link";
import { SiteFooter } from "@/components/system/SiteFooter";
import { Disclaimer } from "@/components/system/Disclaimer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
        <Link href="/" className="type-title">
          AOS
        </Link>
        <h1 className="type-title">Terms</h1>
        <Disclaimer />
        <p className="text-sm leading-6">
          A lawyer has not published terms for AOS yet. This page is not a contract. You choose your forms, you give the answers, and you file them yourself.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
