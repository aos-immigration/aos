"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadAddressHistory,
  saveAddressHistory,
  createEmptyAddress,
  type AddressEntry,
} from "@/app/lib/intakeStorage";
import { PhysicalAddressHistoryList } from "./PhysicalAddressHistoryList";

export function AddressHistory() {
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);

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

  const handleAddressesChange = useCallback((newAddresses: AddressEntry[]) => {
    setAddresses(newAddresses);
    saveAddressHistory(newAddresses);
  }, []);

  if (addresses.length === 0) {
    return null;
  }

  return (
    <PhysicalAddressHistoryList
      addresses={addresses}
      onAddressesChange={handleAddressesChange}
    />
  );
}
