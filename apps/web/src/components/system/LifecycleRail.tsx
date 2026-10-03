import { STAGES, stageVisual, type StageId } from "./stages";
import { cn } from "@/lib/utils";

type LifecycleRailProps = {
  current: StageId | null;
  done?: readonly StageId[];
  className?: string;
};

export function LifecycleRail({
  current,
  done = [],
  className,
}: LifecycleRailProps) {
  return (
    <ol className={cn("flex flex-col gap-4 sm:flex-row sm:flex-wrap", className)}>
      {STAGES.map((stage, index) => {
        const visual = stageVisual(stage.id, current, done);
        return (
          <li
            key={stage.id}
            data-stage={stage.id}
            data-state={visual}
            className="flex min-w-0 flex-1 gap-3 sm:basis-40"
          >
            <span
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
                visual === "current" && "border-foreground bg-foreground text-background",
                visual === "done" && "border-foreground bg-foreground text-background",
                visual === "upcoming" && "border-border text-foreground/70",
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span>
              <span className="block text-sm font-medium">{stage.label}</span>
              <span className="block text-sm text-foreground/75">{stage.note}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
