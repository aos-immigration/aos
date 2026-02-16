"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadAddressHistory,
  saveAddressHistory,
  createEmptyAddress,
  type AddressEntry,
} from "@/app/lib/intakeStorage";
import { validateAllAddresses } from "@/app/lib/addressValidation";
import { PhysicalAddressHistoryList } from "./PhysicalAddressHistoryList";

type AddressHistoryProps = {
  onValidationChange?: (isValid: boolean) => void;
};

export function AddressHistory({ onValidationChange }: AddressHistoryProps) {
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loaded = loadAddressHistory();
    const hasCurrent = loaded.some((a) => a.isCurrent);

    if (loaded.length === 0 || !hasCurrent) {
      const initial = { ...createEmptyAddress(), isCurrent: true };
      const filtered = loaded.filter((a) => a.street?.trim());
      setAddresses([initial, ...filtered]);
    } else {
      setAddresses(loaded);
    }
  }, []);

  const runValidation = useCallback(
    (addressList: AddressEntry[]) => {
      const validationErrors = validateAllAddresses(addressList);
      setErrors(validationErrors);
      onValidationChange?.(Object.keys(validationErrors).length === 0);
    },
    [onValidationChange]
  );

  const handleAddressesChange = useCallback(
    (newAddresses: AddressEntry[]) => {
      setAddresses(newAddresses);
      saveAddressHistory(newAddresses);
      runValidation(newAddresses);
    },
    [runValidation]
  );

  return (
    <PhysicalAddressHistoryList
      addresses={addresses}
      onAddressesChange={handleAddressesChange}
    />
  );
}
