"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, User, Users, Home, Briefcase, Heart, FileText, Stamp, ShieldQuestion, Wallet, ListChecks } from "lucide-react";
import { Disclaimer } from "@/components/system/Disclaimer";
import { cn } from "@/lib/utils";

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
];

export function Sidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["petitioner", "beneficiary", "case"])
  );

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
    <aside className="flex w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar z-20">
      <div className="px-6 py-5">
        <Link href="/" className="type-title">
          AOS
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {sidebarData.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const isActive = isSectionActive(section);

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
              </button>
              {isExpanded && (
                <div className="ml-4 pl-3 border-l border-border space-y-1 py-1">
                  {section.items.map((item) => {
                    const itemActive = isItemActive(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-1.5 text-xs rounded-md transition-colors",
                          itemActive
                            ? "text-primary font-medium bg-primary/10"
                            : "text-muted-foreground hover:text-primary hover:bg-accent"
                        )}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Disclaimer />
      </div>
    </aside>
  );
}
