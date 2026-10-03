"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, User, Users, Home, Briefcase, Heart, FileText, Stamp, ShieldQuestion, Wallet, ListChecks, Scale, Receipt, FolderOpen, Shield } from "lucide-react";
import { FORM_IDS } from "@/app/lib/intake/schema";
import { Disclaimer } from "@/components/system/Disclaimer";
import { cn } from "@/lib/utils";
import { useIntake } from "@/components/intake/IntakeProvider";
import {
  groupSaveState,
  sectionSaveState,
  type GroupSaveState,
  type IntakeSnapshot,
} from "@/app/lib/sectionSaveState";

export type SectionItem = {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export type SidebarSection = {
  id: string;
  title: string;
  items: SectionItem[];
};

const sidebarData: SidebarSection[] = [
  {
    id: "prepare",
    title: "Prepare",
    items: [
      {
        id: "start",
        label: "Before you file",
        href: "/start",
        icon: <Scale className="w-[18px] h-[18px]" />,
      },
      {
        id: "cost",
        label: "USCIS fees",
        href: "/cost",
        icon: <Receipt className="w-[18px] h-[18px]" />,
      },
      {
        id: "documents",
        label: "Documents",
        href: "/sections/documents",
        icon: <FolderOpen className="w-[18px] h-[18px]" />,
      },
    ],
  },
  {
    id: "petitioner",
    title: "Petitioner Information",
    items: [
      {
        id: "petitioner-basic",
        label: "Basic Information",
        href: "/sections/petitioner",
        icon: <User className="w-[18px] h-[18px]" />,
      },
      {
        id: "petitioner-address",
        label: "Address History (5 years)",
        href: "/sections/petitioner/address",
        icon: <Home className="w-[18px] h-[18px]" />,
      },
      {
        id: "petitioner-employment",
        label: "Employment History (5 years)",
        href: "/sections/petitioner/employment",
        icon: <Briefcase className="w-[18px] h-[18px]" />,
      },
    ],
  },
  {
    id: "beneficiary",
    title: "Beneficiary Information",
    items: [
      {
        id: "beneficiary-basic",
        label: "Basic Information",
        href: "/sections/beneficiary",
        icon: <Users className="w-[18px] h-[18px]" />,
      },
      {
        id: "beneficiary-address",
        label: "Address History (5 years)",
        href: "/sections/beneficiary/address",
        icon: <Home className="w-[18px] h-[18px]" />,
      },
      {
        id: "beneficiary-employment",
        label: "Employment History (5 years)",
        href: "/sections/beneficiary/employment",
        icon: <Briefcase className="w-[18px] h-[18px]" />,
      },
      {
        id: "beneficiary-biographic",
        label: "Biographic Details",
        href: "/sections/beneficiary/biographic",
        icon: <FileText className="w-[18px] h-[18px]" />,
      },
    ],
  },
  {
    id: "marital",
    title: "Marital History",
    items: [
      {
        id: "marital-info",
        label: "Marriage Information",
        href: "/sections/marital",
        icon: <Heart className="w-[18px] h-[18px]" />,
      },
    ],
  },
  {
    id: "case",
    title: "Case",
    items: [
      {
        id: "immigration",
        label: "Immigration history",
        href: "/sections/immigration",
        icon: <Stamp className="w-[18px] h-[18px]" />,
      },
      {
        id: "eligibility",
        label: "Eligibility questions",
        href: "/sections/eligibility",
        icon: <ShieldQuestion className="w-[18px] h-[18px]" />,
      },
      {
        id: "sponsor",
        label: "Sponsor",
        href: "/sections/sponsor",
        icon: <Wallet className="w-[18px] h-[18px]" />,
      },
      {
        id: "review",
        label: "Review",
        href: "/sections/review",
        icon: <ListChecks className="w-[18px] h-[18px]" />,
      },
    ],
  },
  {
    id: "evidence",
    title: "Documents & Evidence",
    items: [
      {
        id: "documents",
        label: "Document Vault",
        href: "/sections/documents",
        icon: <Shield className="w-[18px] h-[18px]" />,
      },
      {
        id: "proof",
        label: "Bona Fide Proof",
        href: "/sections/proof",
        icon: <FileText className="w-[18px] h-[18px]" />,
      },
    ],
  },
];

const statusDot: Record<GroupSaveState | "not-saved", string> = {
  saved: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]",
  partial: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
  empty: "bg-slate-400",
  "not-saved": "bg-slate-400",
};

const statusLabel: Record<GroupSaveState | "not-saved", string> = {
  saved: "Saved",
  partial: "Partly saved",
  empty: "Not saved yet",
  "not-saved": "Not saved yet",
};

type SidebarProps = {
  open: boolean;
  onNavigate: () => void;
  snapshot: IntakeSnapshot;
};

export function Sidebar({ open, onNavigate, snapshot }: SidebarProps) {
  const pathname = usePathname();
  const { intake } = useIntake();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["prepare", "petitioner", "beneficiary", "case"])
  );
  const packet = FORM_IDS.filter((id) => intake.selectedForms.includes(id));

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const isSectionActive = (section: SidebarSection) => {
    return section.items.some((item) => pathname === item.href);
  };

  const isItemActive = (href: string) => {
    return pathname === href;
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:static md:flex",
        open ? "flex" : "hidden",
      )}
    >
      <div className="px-6 py-5">
        <Link href="/" className="type-title">
          AOS
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {sidebarData.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const isActive = isSectionActive(section);
          const groupState = groupSaveState(
            section.items.map((item) => item.href),
            snapshot,
          );

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors w-full text-left group",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
                <span className="flex-1">{section.title}</span>
                <span
                  aria-label={statusLabel[groupState]}
                  className={cn("w-1.5 h-1.5 rounded-full", statusDot[groupState])}
                />
              </button>
              {isExpanded && (
                <div className="ml-4 pl-3 border-l border-border space-y-1 py-1">
                  {section.items.map((item) => {
                    const itemActive = isItemActive(item.href);
                    const itemState = sectionSaveState(item.href, snapshot);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center gap-3 px-3 py-1.5 text-xs rounded-md transition-colors",
                          itemActive
                            ? "text-primary font-medium bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-accent"
                        )}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        <span
                          aria-label={statusLabel[itemState]}
                          className={cn("w-1.5 h-1.5 rounded-full", statusDot[itemState])}
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div className="px-3 pt-4 pb-2">
          <p className="px-3 text-xs font-medium text-muted-foreground">In this packet</p>
          {packet.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No forms selected yet.</p>
          ) : (
            <ul className="py-1">
              {packet.map((id) => (
                <li key={id} className="px-3 py-1 text-xs uppercase text-foreground">
                  {id}
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Disclaimer />
      </div>
    </aside>
  );
}
