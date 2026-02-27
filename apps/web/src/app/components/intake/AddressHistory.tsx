"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  createEmptyAddress,
  type AddressEntry,
  type MonthValue,
} from "@/app/lib/intakeStorage";
import { validateAllAddresses } from "@/app/lib/addressValidation";
import { AddressCard } from "./AddressCard";
import { CurrentAddressFormRHF } from "./CurrentAddressFormRHF";
import { PreviousAddressFormRHF } from "./PreviousAddressFormRHF";
import type { Id } from "../../../../convex/_generated/dataModel";

type AddressHistoryProps = {
  applicationId: Id<"applications">;
  personRole?: string;
  onValidationChange?: (isValid: boolean) => void;
};

export function AddressHistory({ applicationId, personRole = "petitioner", onValidationChange }: AddressHistoryProps) {
  const convexAddresses = useQuery(api.petitioner.listAddresses, { applicationId, personRole });
  const saveAddressMutation = useMutation(api.petitioner.saveAddress);
  const removeAddressMutation = useMutation(api.petitioner.removeAddress);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAddress, setDraftAddress] = useState<AddressEntry | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Map Convex documents to AddressEntry type for UI components
  const addresses: AddressEntry[] = convexAddresses
    ? convexAddresses.map((doc) => ({
        id: doc._id,
        street: doc.street,
        unit: doc.unit,
        city: doc.city,
        state: doc.state,
        zip: doc.zip,
        country: doc.country,
        startMonth: doc.startMonth as MonthValue,
        startYear: doc.startYear,
        endMonth: (doc.endMonth ?? undefined) as MonthValue | undefined,
        endYear: doc.endYear ?? undefined,
        isCurrent: doc.isCurrent,
      }))
    : [];

  const runValidation = useCallback(
    (addressList: AddressEntry[]) => {
      const validationErrors = validateAllAddresses(addressList);
      setErrors(validationErrors);
      onValidationChange?.(Object.keys(validationErrors).length === 0);
    },
    [onValidationChange]
  );

  // Run validation whenever Convex data changes
  useEffect(() => {
    if (convexAddresses) {
      runValidation(addresses);
    }
  }, [convexAddresses]);

  const toConvexArgs = useCallback(
    (entry: AddressEntry, sortOrder: number) => ({
      applicationId,
      personRole,
      street: entry.street,
      unit: entry.unit || undefined,
      city: entry.city,
      state: entry.state,
      zip: entry.zip,
      country: entry.country,
      startMonth: entry.startMonth,
      startYear: entry.startYear,
      endMonth: entry.endMonth || undefined,
      endYear: entry.endYear || undefined,
      isCurrent: entry.isCurrent,
      addressType: "physical" as const,
      sortOrder,
    }),
    [applicationId, personRole]
  );

  const handleAddressChange = useCallback(
    async (id: string, updated: AddressEntry) => {
      const index = addresses.findIndex((a) => a.id === id);
      await saveAddressMutation({
        _id: id as Id<"addresses">,
        ...toConvexArgs(updated, index >= 0 ? index : 0),
      });
    },
    [addresses, saveAddressMutation, toConvexArgs]
  );

  const handleRemoveAddress = useCallback(
    async (id: string) => {
      await removeAddressMutation({ id: id as Id<"addresses"> });
      setEditingId(null);
    },
    [removeAddressMutation]
  );

  const handleStartAddPrevious = useCallback(() => {
    const newAddress = {
      ...createEmptyAddress(),
      isCurrent: false,
    };
    setDraftAddress(newAddress);
  }, []);

  const handleCancelDraft = useCallback(() => {
    setDraftAddress(null);
  }, []);

  // Show empty current address form if no current address exists
  const showEmptyCurrentForm = !addresses.some((a) => a.isCurrent);
  const emptyCurrentAddress = showEmptyCurrentForm ? { ...createEmptyAddress(), isCurrent: true } : null;

  const currentAddress = addresses.find((a) => a.isCurrent);
  const previousAddresses = addresses
    .filter((a) => !a.isCurrent)
    .sort((a, b) => {
      const aYear = parseInt(a.startYear || "0", 10);
      const bYear = parseInt(b.startYear || "0", 10);
      if (aYear !== bYear) return bYear - aYear;
      const aMonth = parseInt(a.startMonth || "0", 10);
      const bMonth = parseInt(b.startMonth || "0", 10);
      return bMonth - aMonth;
    });

  const isCurrentEditing = editingId === currentAddress?.id;
  const isAddingPrevious = draftAddress !== null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {emptyCurrentAddress ? (
          <CurrentAddressFormRHF
            address={emptyCurrentAddress}
            onSave={async (updated) => {
              await saveAddressMutation(toConvexArgs({ ...updated, isCurrent: true }, 0));
            }}
          />
        ) : currentAddress && (isCurrentEditing || !currentAddress.street) ? (
          <CurrentAddressFormRHF
            address={currentAddress}
            onSave={async (updated) => {
              await handleAddressChange(currentAddress.id, updated);
              setEditingId(null);
            }}
          />
        ) : currentAddress ? (
          <AddressCard
            address={currentAddress}
            onEdit={() => setEditingId(currentAddress.id)}
            onRemove={() => handleRemoveAddress(currentAddress.id)}
            showRemove={false}
          />
        ) : null}
      </div>

      {previousAddresses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Previous Addresses ({previousAddresses.length})
          </h3>

          {previousAddresses.map((address, index) => {
            const isEditing = editingId === address.id;
            const olderAddress = previousAddresses[index + 1];

            return (
              <div
                key={address.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {isEditing ? (
                  <PreviousAddressFormRHF
                    address={address}
                    onSave={(updated) => {
                      handleAddressChange(address.id, updated);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                    index={index + 1}
                  />
                ) : (
                  <AddressCard
                    address={address}
                    onEdit={() => setEditingId(address.id)}
                    onRemove={() => handleRemoveAddress(address.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {isAddingPrevious && draftAddress && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <PreviousAddressFormRHF
            address={draftAddress}
            onSave={async (saved) => {
              await saveAddressMutation(toConvexArgs(saved, addresses.length));
              setDraftAddress(null);
            }}
            onCancel={handleCancelDraft}
            index={previousAddresses.length + 1}
          />
        </div>
      )}

      {!isAddingPrevious && (
        <Button type="button" variant="secondary" onClick={handleStartAddPrevious}>
          Add Previous Address
        </Button>
      )}
    </div>
  );
}
