"use client";

import { useCallback, useState } from "react";
import type { AddressEntry } from "@/app/lib/intakeStorage";
import {
  validateAddress,
  type ValidationErrors,
} from "@/app/lib/addressValidation";
import { hasSignificantGap } from "@/app/lib/gapDetection";

export type UseAddressValidationResult = {
  errors: ValidationErrors;
  isValid: boolean;
  hasGap: boolean;
  validate: () => boolean;
  clearErrors: () => void;
};

export function useAddressValidation(
  address: AddressEntry,
  allAddresses: AddressEntry[],
  previousAddress?: AddressEntry
): UseAddressValidationResult {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = useCallback(() => {
    const validationErrors = validateAddress(address, allAddresses);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [address, allAddresses]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasGap =
    previousAddress && !address.isCurrent
      ? hasSignificantGap(address, previousAddress)
      : false;

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    hasGap,
    validate,
    clearErrors,
  };
}
