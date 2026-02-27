"use client";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../../convex/_generated/dataModel";

export function useApplicationId() {
  const [applicationId, setApplicationId] = useState<Id<"applications"> | null>(null);
  const getOrCreate = useMutation(api.petitioner.getOrCreateApplication);
  useEffect(() => {
    getOrCreate().then(setApplicationId);
  }, []);
  return applicationId;
}

