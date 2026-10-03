import Link from "next/link";
import { SiteFooter } from "@/components/system/SiteFooter";
import { PRIVACY_LINES, visibleCopy } from "@/components/system/copy";

export default function PrivacyPage() {
  const lines = visibleCopy(PRIVACY_LINES);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
        <Link href="/" className="type-title">
          AOS
        </Link>
        <h1 className="type-title">Privacy</h1>
        <ul className="space-y-4">
          {lines.map((line) => (
            <li key={line.id} className="text-sm leading-6">
              {line.text}
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
