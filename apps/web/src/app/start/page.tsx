import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const TOPICS = [
  "You entered the U.S. without being inspected by an immigration officer, or you're not sure how you entered.",
  "You were ever ordered removed, deported, or excluded, or you left the U.S. while a removal case was open.",
  "You are now, or ever were, in immigration court proceedings.",
  "You were ever arrested, cited, charged, or convicted of any crime or offense anywhere in the world.",
  "You have a prior marriage that may not have been legally ended.",
  "You were ever denied a visa or green card.",
] as const;

export default function StartPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="type-title">Talk to an attorney before filing if any of these apply</h1>
        <p className="mt-3 text-sm leading-6">
          AOS can&apos;t tell you whether you qualify for a green card, and this list doesn&apos;t decide that either.
        </p>
      </div>
      <ul className="space-y-3 text-sm leading-6">
        {TOPICS.map((topic) => (
          <li key={topic}>{topic}</li>
        ))}
      </ul>
      <Link href="/sections" className={buttonVariants({ size: "cta" })}>
        Back to my forms
      </Link>
    </main>
  );
}
