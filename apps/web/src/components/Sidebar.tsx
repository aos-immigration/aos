"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, User, Users, Home, Briefcase, Heart, FileText, Image, Settings, Shield } from "lucide-react";
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
  status?: "complete" | "in-progress" | "pending";
  progress?: number;
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
    status: "complete",
    progress: 100,
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
    status: "in-progress",
    progress: 45,
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
    status: "in-progress",
    progress: 60,
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
        icon: <Image className="w-[18px] h-[18px]" />,
      },
    ],
    status: "in-progress",
    progress: 60,
  },
];

const getStatusDot = (status?: string) => {
  switch (status) {
    case "complete":
      return "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]";
    case "in-progress":
      return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
    default:
      return "bg-slate-400";
  }
};

export function Sidebar() {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["petitioner", "beneficiary"]) // Default to both expanded
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
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0 z-20">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
          <Shield className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sm tracking-tight">Immigration OS</span>
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
                {section.status && (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      getStatusDot(section.status)
                    )}
                  />
                )}
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

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">John Doe</div>
            <div className="text-[10px] text-muted-foreground truncate font-mono uppercase">
              APP-2024-0891
            </div>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
