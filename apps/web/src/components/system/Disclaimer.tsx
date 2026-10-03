import { DISCLAIMER } from "./copy";
import { cn } from "@/lib/utils";

export function Disclaimer({ className }: { className?: string }) {
  return <p className={cn("disclaimer", className)}>{DISCLAIMER}</p>;
}
