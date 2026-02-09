"use client";

import { AddressHistory } from "@/app/components/intake/AddressHistory";
import { PdfVerifyButton } from "@/app/components/PdfVerifyButton";

export default function PetitionerAddressPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Petitioner Address History
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Provide your address history for the past 5 years. Include all
            addresses where you have lived, even if temporary.
          </p>
        </div>
      </div>

      <AddressHistory />

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-semibold mb-3">Verify on PDF Forms</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Preview how your addresses will appear on the actual immigration forms.
        </p>
        <div className="flex flex-wrap gap-3">
          <PdfVerifyButton formSlug="i-130" label="Preview I-130" />
          <PdfVerifyButton formSlug="i-130a" label="Preview I-130A" />
          <PdfVerifyButton formSlug="i-485" label="Preview I-485" />
          <PdfVerifyButton formSlug="i-765" label="Preview I-765" />
          <PdfVerifyButton formSlug="i-131" label="Preview I-131" />
        </div>
      </div>
    </div>
  );
}
