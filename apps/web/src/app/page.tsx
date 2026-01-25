import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="max-w-2xl mx-auto px-6 py-10 text-center space-y-8">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Immigration OS
          </p>
          <h1 className="text-4xl font-semibold leading-tight">
            Complete your immigration forms with confidence
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
            This app will help you fill out spouse-based Adjustment of Status
            forms like I-130, I-485, I-765, and I-131 with a beautiful,
            intuitive interface.
          </p>
        </header>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/sections"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Start Your Application
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
