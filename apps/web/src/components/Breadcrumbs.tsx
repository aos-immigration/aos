"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sectionLabels: Record<string, string> = {
  petitioner: "Petitioner Information",
  beneficiary: "Beneficiary Information",
  biographic: "Biographic Details",
  address: "Address History",
  employment: "Employment History",
  marital: "Marital History",
  documents: "Document Vault",
  proof: "Bona Fide Proof",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): Array<{ label: string; href?: string }> => {
    const items: Array<{ label: string; href?: string }> = [
      { label: "Application", href: "/sections" },
    ];

    if (pathname.startsWith("/sections/")) {
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const sectionId = parts[1];
        const sectionLabel =
          sectionLabels[sectionId] ||
          sectionId
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        items.push({ label: sectionLabel });
      }
    }

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="flex items-center gap-2 text-sm">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {item.href && index < breadcrumbs.length - 1 ? (
            <Link
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}
