"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_API_URL = "http://localhost:8000";

export function PdfFillDemo() {
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [isSpouse, setIsSpouse] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
    []
  );

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        fields: {
          "form1[0].#subform[0].Pt2Line4a_FamilyName[0]": familyName,
          "form1[0].#subform[0].Pt2Line4b_GivenName[0]": givenName,
        },
        checkboxes: {
          "form1[0].#subform[0].Pt1Line1_Spouse[0]": isSpouse,
        },
      };

      const response = await fetch(`${apiBase}/fill/i-130`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Fill failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(url);
  } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fill PDF";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold">Quick fill demo (I-130)</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        Enter a couple fields and download a filled PDF via the FastAPI service.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span>Given name</span>
          <input
            value={givenName}
            onChange={(event) => setGivenName(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="Alex"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span>Family name</span>
          <input
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="Doe"
          />
        </label>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={isSpouse}
            onChange={(event) => setIsSpouse(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
          />
          <span>Filing for spouse (Part 1, Line 1)</span>
        </label>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isLoading ? "Generating..." : "Generate filled PDF"}
          </button>
          {error ? (
            <span className="text-sm text-red-600">{error}</span>
          ) : null}
        </div>
      </form>

      {pdfUrl ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Preview (filled PDF)
          </p>
          <iframe
            title="Filled I-130 preview"
            src={pdfUrl}
            className="mt-3 h-[560px] w-full rounded-md border border-zinc-200 bg-white dark:border-zinc-800"
          />
        </div>
      ) : null}
    </section>
  );
}
