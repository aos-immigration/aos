"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const GAP_REASONS = [
  { value: "traveling", label: "Traveling" },
  { value: "unemployed", label: "Between jobs / Unemployed" },
  { value: "student", label: "Student" },
  { value: "staying_with_family", label: "Staying with family" },
  { value: "other", label: "Other" },
] as const;

type GapExplanationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (explanation: string) => void;
  currentExplanation?: string;
};

export function GapExplanationDialog({
  open,
  onOpenChange,
  onSave,
  currentExplanation,
}: GapExplanationDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>(() => {
    if (!currentExplanation) return "";
    const found = GAP_REASONS.find((r) =>
      currentExplanation.toLowerCase().includes(r.value.replace("_", " "))
    );
    return found?.value ?? "other";
  });
  const [customText, setCustomText] = useState<string>(() => {
    if (!currentExplanation) return "";
    const found = GAP_REASONS.find((r) =>
      currentExplanation.toLowerCase().includes(r.value.replace("_", " "))
    );
    return found ? "" : currentExplanation;
  });

  const handleSave = () => {
    if (!selectedReason) return;

    let explanation: string;
    if (selectedReason === "other") {
      explanation = customText.trim() || "Other";
    } else {
      const reason = GAP_REASONS.find((r) => r.value === selectedReason);
      explanation = reason?.label ?? selectedReason;
      if (customText.trim()) {
        explanation += `: ${customText.trim()}`;
      }
    }

    onSave(explanation);
  };

  const canSave = selectedReason && (selectedReason !== "other" || customText.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Address Gap Detected</DialogTitle>
          <DialogDescription>
            We noticed a gap of more than 30 days between your addresses. Can you
            explain what happened during this time? This helps us complete your
            immigration forms accurately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>What were you doing during this time?</Label>
            <div className="grid gap-2">
              {GAP_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <input
                    type="radio"
                    name="gap-reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason && (
            <div className="space-y-2">
              <Label>
                {selectedReason === "other"
                  ? "Please explain"
                  : "Additional details (optional)"}
              </Label>
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={
                  selectedReason === "other"
                    ? "Please describe your situation..."
                    : "Any additional context..."
                }
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip for now
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save explanation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
