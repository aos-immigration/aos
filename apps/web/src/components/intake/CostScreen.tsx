"use client";

import { feeLines, feeTotal, SERVICE_FEE, type FilingMethod } from "@/app/lib/intake/fees";
import { FORM_IDS } from "@/app/lib/intake/schema";
import { LoadingState } from "@/components/system/States";
import { cn } from "@/lib/utils";
import { useIntake } from "./IntakeProvider";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function CostScreen() {
  const { intake, ready, update } = useIntake();
  if (!ready) return <LoadingState label="Loading your answers" />;

  const method = intake.filingMethod;
  const chosen = FORM_IDS.filter((id) => intake.selectedForms.includes(id));
  const lines = feeLines(chosen.length > 0 ? chosen : FORM_IDS, method);
  const total = chosen.length > 0 ? feeTotal(chosen, method) : null;

  const setMethod = (next: FilingMethod) => {
    update({ ...intake, filingMethod: next });
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="type-title">USCIS fees</h1>
        <p className="mt-2 text-sm leading-6">
          {chosen.length > 0
            ? "These are the fees for the forms you selected. AOS does not collect them."
            : "No forms are selected. Each line is the USCIS fee if you later choose that form. AOS does not collect them."}
        </p>
      </div>
      <div className="flex gap-2" role="group" aria-label="Filing method">
        {(["paper", "online"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={method === option}
            className={cn(
              "h-10 rounded-md border border-border px-4 text-sm capitalize",
              method === option && "border-foreground bg-foreground text-background",
            )}
            onClick={() => setMethod(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {lines.map((line) => (
            <tr key={line.id}>
              <th scope="row" className="py-3 text-left font-normal">
                {line.label}
              </th>
              <td className="py-3 text-right align-top tabular-nums">{money.format(line.amount)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row" className="py-3 text-left font-normal">
              AOS service fee
            </th>
            <td className="py-3 text-right tabular-nums">{money.format(SERVICE_FEE)}</td>
          </tr>
          {total !== null ? (
            <tr>
              <th scope="row" className="py-3 text-left font-medium">
                USCIS total
              </th>
              <td className="py-3 text-right font-medium tabular-nums">{money.format(total)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <p className="text-xs leading-5 text-foreground/60">USCIS Form G-1055, edition 10/01/26.</p>
    </div>
  );
}
