import { IntakeFlow } from "./components/intake/IntakeFlow";

export default function Home() {
  return (
    <div className="flex min-h-screen items-start justify-start bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-none flex-col items-stretch justify-start gap-8 px-6 py-10 opacity-100 sm:px-10">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            AOS Companion
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            Collect user info once, then generate USCIS forms automatically.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
            This app will capture spouse-based Adjustment of Status details and
            map them to official PDFs like I-130, I-485, I-765, and I-131.
          </p>
        </header>

        <IntakeFlow />

      </main>
    </div>
  );
}
