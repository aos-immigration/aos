"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isPublicDemo } from "@/app/lib/demoPolicy";
import { maskANumberLast4, maskSsnLast4, normalizeANumber, normalizeSsn } from "@/app/lib/sensitiveId";

const schema = z.object({
  ssn: z.string().refine((value) => value.trim() === "" || normalizeSsn(value) !== null, {
    message: "Enter a 9-digit Social Security number",
  }),
  aNumber: z.string().refine((value) => value.trim() === "" || normalizeANumber(value) !== null, {
    message: "Enter an A-Number with 7 to 9 digits",
  }),
});

type FormValues = z.infer<typeof schema>;

export function SensitiveIdForm({
  applicationId,
  ssnLast4,
  aNumberLast4,
}: {
  applicationId: Id<"applications">;
  ssnLast4: string | null;
  aNumberLast4: string | null;
}) {
  const save = useMutation(api.sensitive.saveSensitiveIds);
  const locked = isPublicDemo();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ssn: "", aNumber: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (locked) {
      setStatus("This public demo does not collect this number.");
      return;
    }
    setStatus(null);
    try {
      const saved = await save({
        applicationId,
        ...(values.ssn.trim() ? { ssn: values.ssn } : {}),
        ...(values.aNumber.trim() ? { aNumber: values.aNumber } : {}),
      });
      reset({ ssn: "", aNumber: "" });
      setStatus(`Saved ${maskSsnLast4(saved.ssnLast4)} and ${maskANumberLast4(saved.aNumberLast4)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save";
      setStatus(message.split(values.ssn).join("").split(values.aNumber).join(""));
    }
  });

  return (
    <form onSubmit={onSubmit} className="border border-border p-6 rounded-xl space-y-4 bg-card">
      <div>
        <h3 className="font-medium">Identity numbers</h3>
        <p className="text-sm text-muted-foreground">
          {locked
            ? "This public demo does not collect this number."
            : "Saved encrypted. This screen only shows the last four digits."}
        </p>
      </div>
      <p className="text-sm" data-dd-privacy="hidden">
        Social Security number on file: {maskSsnLast4(ssnLast4)}. A-Number on file:{" "}
        {maskANumberLast4(aNumberLast4)}.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="ssn">Social Security number</Label>
          <Input
            id="ssn"
            type={visible ? "text" : "password"}
            autoComplete="off"
            data-dd-privacy="hidden"
            spellCheck={false}
            placeholder="Enter to replace the saved value"
            disabled={locked}
            {...register("ssn")}
          />
          {errors.ssn && <p className="text-xs text-red-500">{errors.ssn.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="aNumber">A-Number</Label>
          <Input
            id="aNumber"
            type={visible ? "text" : "password"}
            autoComplete="off"
            data-dd-privacy="hidden"
            spellCheck={false}
            placeholder="Enter to replace the saved value"
            disabled={locked}
            {...register("aNumber")}
          />
          {errors.aNumber && <p className="text-xs text-red-500">{errors.aNumber.message}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className="text-xs underline" onClick={() => setVisible((value) => !value)}>
          {visible ? "Hide" : "Show"}
        </button>
        <button
          type="submit"
          disabled={locked}
          className="text-xs font-medium bg-primary text-primary-foreground px-3 py-2 rounded disabled:opacity-50"
        >
          Save numbers
        </button>
      </div>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </form>
  );
}
