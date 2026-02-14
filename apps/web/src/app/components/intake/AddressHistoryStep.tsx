"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepShell } from "./StepShell";
import { AddressCard } from "./AddressCard";
import { CurrentAddressFormRHF } from "./CurrentAddressFormRHF";
import { PreviousAddressFormRHF } from "./PreviousAddressFormRHF";
import { MailingAddressFormRHF } from "./MailingAddressFormRHF";
import type { IntakeData, AddressEntry } from "@/app/lib/intakeStorage";

type AddressHistoryStepProps = {
  data: IntakeData;
  yearOptions: string[];
  onMailingSameAsPhysicalChange: (value: boolean) => void;
  onMailingAddressChange: (patch: Partial<AddressEntry>) => void;
  onUpdateAddress: (id: string, patch: Partial<AddressEntry>) => void;
  onAddAddress: () => void;
  onRemoveAddress: (id: string) => void;
};

export function AddressHistoryStep({
  data,
  onMailingSameAsPhysicalChange,
  onMailingAddressChange,
  onUpdateAddress,
  onAddAddress,
  onRemoveAddress,
}: AddressHistoryStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingMailing, setIsEditingMailing] = useState(false);

  const needsMailingAddress = data.mailingSameAsPhysical === false;

  return (
    <StepShell
      title="Address history (last 5 years)"
      description="Start with your current address and work backwards. It’s okay to estimate months."
    >
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-2 text-sm">
          <Label>
            Is your current mailing address the same as your physical address?
          </Label>
          <Select
            value={data.mailingSameAsPhysical ? "yes" : "no"}
            onValueChange={(value) => onMailingSameAsPhysicalChange(value === "yes")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes, they are the same</SelectItem>
              <SelectItem value="no">No, they are different</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>

      {needsMailingAddress && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
           {isEditingMailing || !data.mailingAddress.street ? (
             <MailingAddressFormRHF
               address={data.mailingAddress}
               onSave={(updated) => {
                 onMailingAddressChange(updated);
                 setIsEditingMailing(false);
               }}
             />
           ) : (
             <AddressCard
               address={data.mailingAddress}
               onEdit={() => setIsEditingMailing(true)}
               onRemove={() => {}}
               showRemove={false}
             />
           )}
        </div>
      )}

      {data.addresses.map((entry, idx) => {
        const isEditing = editingId === entry.id || !entry.street;

        return (
          <div
            key={entry.id}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {isEditing ? (
              idx === 0 ? (
                <CurrentAddressFormRHF
                  address={entry}
                  onSave={(updated) => {
                    onUpdateAddress(entry.id, updated);
                    setEditingId(null);
                  }}
                />
              ) : (
                <PreviousAddressFormRHF
                  address={entry}
                  onSave={(updated) => {
                    onUpdateAddress(entry.id, updated);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                  index={idx}
                />
              )
            ) : (
              <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {idx === 0 ? "Current address" : `Previous address ${idx}`}
                    </p>
                 </div>
                 <AddressCard
                   address={entry}
                   onEdit={() => setEditingId(entry.id)}
                   onRemove={() => onRemoveAddress(entry.id)}
                   showRemove={data.addresses.length > 1}
                 />
              </div>
            )}
          </div>
        );
      })}

      <Button type="button" variant="secondary" onClick={onAddAddress}>
        Add another address
      </Button>
    </StepShell>
  );
}
