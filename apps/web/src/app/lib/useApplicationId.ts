"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useDemoMode } from "./intakeMode";

export function useApplicationId() {
  const demo = useDemoMode();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [applicationId, setApplicationId] = useState<Id<"applications"> | null>(null);
  const getOrCreate = useMutation(api.petitioner.getOrCreateApplication);

  useEffect(() => {
    if (demo || isLoading || !isAuthenticated) return;
    let cancelled = false;
    getOrCreate()
      .then((id) => {
        if (!cancelled) setApplicationId(id);
      })
      .catch(() => {
        if (!cancelled) setApplicationId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [demo, isAuthenticated, isLoading, getOrCreate]);

  return demo ? null : applicationId;
}
