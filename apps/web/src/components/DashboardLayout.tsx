"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { Eye, Loader2 } from "lucide-react";
import { LifecycleRail } from "@/components/system/LifecycleRail";
import type { StageId } from "@/components/system/stages";
import { ErrorState } from "@/components/system/States";
import { SiteFooter } from "@/components/system/SiteFooter";
import {
  PERSISTABLE_SECTION_HREFS,
  savedSectionCount,
  type IntakeSnapshot,
} from "@/app/lib/sectionSaveState";
import { SavedSectionsLabel } from "@/components/SavedSectionsLabel";
import { LoadDemoButton } from "@/components/intake/LoadDemoButton";
import { FormPreview, type PreviewForm } from "@/components/intake/FormPreview";
import { DOWNLOAD_BOXES } from "@/components/intake/trustCopy";
import { useIntake } from "@/components/intake/IntakeProvider";
import type { Intake } from "@/app/lib/intake/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

function stageFor(pathname: string): StageId {
  if (pathname === "/start" || pathname === "/cost") return "start";
  if (pathname.startsWith("/sections/review")) return "review";
  return "collect";
}

function snapshotFromIntake(intake: Intake): IntakeSnapshot {
  return {
    petitionerGivenName: intake.petitioner.givenName,
    petitionerFamilyName: intake.petitioner.familyName,
    petitionerAddressCount: intake.addresses.filter(
      (row) => row.personRole === "petitioner" && row.street.trim() !== "",
    ).length,
    petitionerEmploymentCount: intake.employment.filter(
      (row) => row.personRole === "petitioner" && row.fromYear.trim() !== "",
    ).length,
    beneficiaryAddressCount: intake.addresses.filter(
      (row) => row.personRole === "beneficiary" && row.street.trim() !== "",
    ).length,
  };
}

const EMPTY_SNAPSHOT: IntakeSnapshot = {
  petitionerGivenName: "",
  petitionerFamilyName: "",
  petitionerAddressCount: 0,
  petitionerEmploymentCount: 0,
  beneficiaryAddressCount: 0,
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const { intake, ready } = useIntake();
  const snapshot = ready ? snapshotFromIntake(intake) : null;
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        open={navOpen}
        onNavigate={() => setNavOpen(false)}
        snapshot={snapshot ?? EMPTY_SNAPSHOT}
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="z-10 border-b border-border bg-background">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-sm underline decoration-foreground/30 underline-offset-4 md:hidden"
                onClick={() => setNavOpen((open) => !open)}
              >
                {navOpen ? "Close" : "Menu"}
              </button>
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-3">
              {snapshot ? (
                <SavedSectionsLabel
                  persistable={PERSISTABLE_SECTION_HREFS.length}
                  saved={savedSectionCount(snapshot)}
                />
              ) : (
                <div className="text-[10px] font-mono text-muted-foreground">
                  Checking saved sections
                </div>
              )}
              <SaveStatus />
              <LoadDemoButton className="text-sm underline decoration-foreground/30 underline-offset-4" />
              <ThemeToggle />
              <PreviewControls />
            </div>
          </div>
          <div className="border-t border-border px-6 py-4">
            <LifecycleRail current={stageFor(pathname)} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="p-6 md:p-8">{children}</div>
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}

function SaveStatus() {
  const { status, error } = useIntake();
  if (status === "idle") return null;
  return (
    <span className="max-w-48 truncate text-sm" role="status">
      {status === "saving" ? "Saving" : status === "saved" ? "Saved" : error}
    </span>
  );
}

function PreviewControls() {
  const { intake } = useIntake();
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [open, setOpen] = useState(false);
  const [forms, setForms] = useState<PreviewForm[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [acks, setAcks] = useState<boolean[]>(() => DOWNLOAD_BOXES.map(() => false));
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const openPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAcks(DOWNLOAD_BOXES.map(() => false));
    setOpen(true);
    try {
      const response = await fetch(`${apiBase}/preview-intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake }),
      });
      if (!response.ok) {
        throw new Error(`Failed to prepare the preview (${response.status})`);
      }
      const body = (await response.json()) as { forms?: PreviewForm[]; notes?: string[] };
      setForms(body.forms ?? []);
      setNotes(body.notes ?? []);
    } catch (err) {
      setForms([]);
      setNotes([]);
      setError(err instanceof Error ? err.message : "Failed to prepare the preview");
    } finally {
      setLoading(false);
    }
  }, [apiBase, intake]);

  const downloadPacket = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/packet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake, acknowledged: true }),
      });
      if (!response.ok) {
        throw new Error(`Failed to build the packet (${response.status})`);
      }
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aos-packet.zip";
      a.click();
      globalThis.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build the packet");
    } finally {
      setDownloading(false);
    }
  }, [apiBase, intake]);

  return (
    <>
      <button
        type="button"
        onClick={openPreview}
        disabled={loading}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
        Preview
      </button>
      {error && !open ? <ErrorState message={error} /> : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92vh] w-[min(92vw,56rem)] max-w-4xl flex-col gap-4 overflow-hidden p-6">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
            <DialogDescription>
              Page images of the draft forms. The PDF downloads only after the acknowledgements.
            </DialogDescription>
          </DialogHeader>
          {error ? <ErrorState message={error} /> : null}
          <FormPreview
            forms={forms}
            notes={notes}
            loading={loading}
            downloading={downloading}
            acks={acks}
            onToggle={(index, checked) =>
              setAcks((current) => current.map((value, item) => (item === index ? checked : value)))
            }
            onDownload={downloadPacket}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
