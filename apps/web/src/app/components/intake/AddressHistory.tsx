"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  loadAddressHistory,
  saveAddressHistory,
  createEmptyAddress,
  type AddressEntry,
} from "@/app/lib/intakeStorage";
import { validateAllAddresses } from "@/app/lib/addressValidation";
import { AddressCard } from "./AddressCard";
import { CurrentAddressFormRHF } from "./CurrentAddressFormRHF";
import { PreviousAddressFormRHF } from "./PreviousAddressFormRHF";

type AddressHistoryProps = {
  onValidationChange?: (isValid: boolean) => void;
  addresses?: AddressEntry[];
  onAddressesChange?: (addresses: AddressEntry[]) => void;
};

export function AddressHistory({
  onValidationChange,
  addresses: propAddresses,
  onAddressesChange,
}: AddressHistoryProps) {
  const [internalAddresses, setInternalAddresses] = useState<AddressEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAddress, setDraftAddress] = useState<AddressEntry | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isControlled = propAddresses !== undefined;
  const addresses = isControlled ? propAddresses : internalAddresses;

  useEffect(() => {
    if (!isControlled) {
      const loaded = loadAddressHistory();
      const hasCurrent = loaded.some((a) => a.isCurrent);

      if (loaded.length === 0 || !hasCurrent) {
        const initial = { ...createEmptyAddress(), isCurrent: true };
        const filtered = loaded.filter((a) => a.street?.trim());
        setInternalAddresses([initial, ...filtered]);
      } else {
        setInternalAddresses(loaded);
      }
    }
  }, [isControlled]);

  const runValidation = useCallback(
    (addressList: AddressEntry[]) => {
      const validationErrors = validateAllAddresses(addressList);
      setErrors(validationErrors);
      onValidationChange?.(Object.keys(validationErrors).length === 0);
    },
    [onValidationChange]
  );

  useEffect(() => {
    runValidation(addresses);
  }, [addresses, runValidation]);

  const saveAndValidate = useCallback(
    (newAddresses: AddressEntry[]) => {
      if (isControlled) {
        onAddressesChange?.(newAddresses);
      } else {
        setInternalAddresses(newAddresses);
        saveAddressHistory(newAddresses);
      }
    },
    [isControlled, onAddressesChange]
  );

  const handleAddressChange = useCallback(
    (id: string, updated: AddressEntry) => {
      const newAddresses = addresses.map((a) => (a.id === id ? updated : a));
      saveAndValidate(newAddresses);
    },
    [addresses, saveAndValidate]
  );

  const handleRemoveAddress = useCallback(
    (id: string) => {
      const newAddresses = addresses.filter((a) => a.id !== id);
      if (newAddresses.length === 0) {
        const initial = { ...createEmptyAddress(), isCurrent: true };
        saveAndValidate([initial]);
      } else {
        saveAndValidate(newAddresses);
      }
      setEditingId(null);
    },
    [addresses, saveAndValidate]
  );

  const handleStartAddPrevious = useCallback(() => {
    const newAddress = {
      ...createEmptyAddress(),
      isCurrent: false,
    };

    const current = addresses.find((a) => a.isCurrent);
    if (current?.startMonth && current?.startYear) {
      const startMonth = parseInt(current.startMonth, 10);
      const startYear = parseInt(current.startYear, 10);

      let endMonth = startMonth - 1;
      let endYear = startYear;
      if (endMonth < 1) {
        endMonth = 12;
        endYear -= 1;
      }

      newAddress.endMonth = String(endMonth).padStart(2, "0") as AddressEntry["endMonth"];
      newAddress.endYear = String(endYear);
    }

    setDraftAddress(newAddress);
  }, [addresses]);

  const handleCancelDraft = useCallback(() => {
    setDraftAddress(null);
  }, []);

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
        {currentAddress && (isCurrentEditing || !currentAddress.street) ? (
          <CurrentAddressFormRHF
            address={currentAddress}
            onSave={(updated) => {
              handleAddressChange(currentAddress.id, updated);
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
            onSave={(saved) => {
              const newAddresses = [...addresses, saved];
              saveAndValidate(newAddresses);
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
