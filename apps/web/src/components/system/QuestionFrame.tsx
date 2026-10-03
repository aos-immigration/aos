import { WhyWeAsk } from "./WhyWeAsk";

type QuestionFrameProps = {
  index: number;
  total: number;
  title: string;
  why?: string;
  note?: string;
  nextLabel?: string;
  onNext?: () => void;
  onBack?: () => void;
  children: React.ReactNode;
};

export function QuestionFrame({
  index,
  total,
  title,
  why,
  note,
  nextLabel = "Next",
  onNext,
  onBack,
  children,
}: QuestionFrameProps) {
  const position = Math.min(Math.max(index, 1), total);
  const width = total === 0 ? 0 : (position / total) * 100;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <div className="space-y-3">
        <p className="text-sm tabular-nums">
          Question {position} of {total}
        </p>
        <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full bg-foreground" style={{ width: `${width}%` }} />
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="type-title">{title}</h1>
        {children}
        {why ? <WhyWeAsk>{why}</WhyWeAsk> : null}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {onBack ? (
          <button
            type="button"
            className="text-sm underline decoration-foreground/30 underline-offset-4"
            onClick={onBack}
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground"
          onClick={onNext}
        >
          {nextLabel}
        </button>
        {note ? <p className="text-sm">{note}</p> : null}
      </div>
    </section>
  );
}
