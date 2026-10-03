import { cn } from "@/lib/utils";

export function LoadingState({ label }: { label: string }) {
  return (
    <p className="text-sm" role="status">
      {label}
    </p>
  );
}

export function EmptyState({
  title,
  detail,
  className,
}: {
  title: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-dashed border-border px-6 py-10", className)}>
      <p className="type-title text-[1.35rem]">{title}</p>
      {detail ? <p className="mt-2 max-w-md text-sm leading-6">{detail}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground" role="alert">
      {message}
    </p>
  );
}
