"use client";

import { useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "../../../convex/_generated/api";
import { demoIntake } from "@/app/lib/intake/demo";
import { emptyIntake } from "@/app/lib/intake/empty";
import { memoryIntake, setMemoryIntake } from "@/app/lib/intake/memory";
import { parseIntake, type Intake } from "@/app/lib/intake/schema";
import { useApplicationId } from "@/app/lib/useApplicationId";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type IntakeApi = {
  intake: Intake;
  ready: boolean;
  status: SaveStatus;
  error: string | null;
  update: (next: Intake) => void;
  loadDemo: () => void;
  clear: () => void;
};

const IntakeContext = createContext<IntakeApi | null>(null);

export function useIntake(): IntakeApi {
  const value = useContext(IntakeContext);
  if (!value) {
    throw new Error("useIntake must be used inside IntakeProvider");
  }
  return value;
}

function useSaveQueue(commit: (next: Intake) => Promise<void>) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Intake | null>(null);
  const writing = useRef(false);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const flush = useCallback(async () => {
    if (writing.current) return;
    writing.current = true;
    try {
      while (latest.current) {
        const snapshot = latest.current;
        await commit(snapshot);
        if (latest.current === snapshot) {
          latest.current = null;
          setStatus("saved");
          setError(null);
        }
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not save your answers.");
    } finally {
      writing.current = false;
    }
  }, [commit]);

  const queue = useCallback(
    (next: Intake) => {
      latest.current = next;
      setStatus("saving");
      setError(null);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void flush();
      }, 500);
    },
    [flush],
  );

  return { status, error, queue };
}

function MemoryIntakeProvider({ children }: { children: React.ReactNode }) {
  const [intake, setIntake] = useState<Intake>(() => memoryIntake());
  const commit = useCallback(async (next: Intake) => {
    setMemoryIntake(next);
  }, []);
  const { status, error, queue } = useSaveQueue(commit);

  const update = useCallback(
    (next: Intake) => {
      setMemoryIntake(next);
      setIntake(next);
      queue(next);
    },
    [queue],
  );

  const value = useMemo<IntakeApi>(
    () => ({
      intake,
      ready: true,
      status,
      error,
      update,
      loadDemo: () => update(demoIntake()),
      clear: () => update(emptyIntake()),
    }),
    [intake, status, error, update],
  );

  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}

function ConvexIntakeProvider({ children }: { children: React.ReactNode }) {
  const applicationId = useApplicationId();
  const row = useQuery(api.intake.getIntake, applicationId ? { applicationId } : "skip");
  const save = useMutation(api.intake.saveIntake);
  const [override, setOverride] = useState<Intake | null>(null);

  const loaded = useMemo(() => {
    if (!applicationId || row === undefined) return null;
    if (!row) return { intake: emptyIntake(), error: null as string | null };
    try {
      return { intake: parseIntake(row.payload), error: null as string | null };
    } catch (err) {
      return {
        intake: emptyIntake(),
        error: err instanceof Error ? err.message : "Saved answers could not be read.",
      };
    }
  }, [applicationId, row]);

  const commit = useCallback(
    async (next: Intake) => {
      if (!applicationId) {
        throw new Error("The application is still opening. Try again in a moment.");
      }
      await save({ applicationId, payload: JSON.stringify(next) });
    },
    [applicationId, save],
  );
  const { status, error, queue } = useSaveQueue(commit);

  const update = useCallback(
    (next: Intake) => {
      setOverride(next);
      queue(next);
    },
    [queue],
  );

  const value = useMemo<IntakeApi>(
    () => ({
      intake: override ?? loaded?.intake ?? emptyIntake(),
      ready: loaded !== null,
      status,
      error: error ?? loaded?.error ?? null,
      update,
      loadDemo: () => update(demoIntake()),
      clear: () => update(emptyIntake()),
    }),
    [override, loaded, status, error, update],
  );

  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}

export function IntakeProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <ConvexIntakeProvider>{children}</ConvexIntakeProvider>;
  }
  return <MemoryIntakeProvider>{children}</MemoryIntakeProvider>;
}
