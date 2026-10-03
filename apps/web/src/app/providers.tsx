"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";
import { IntakeProvider } from "@/components/intake/IntakeProvider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const app = <IntakeProvider>{children}</IntakeProvider>;
  if (!convex) {
    return app;
  }

  return <ConvexProvider client={convex}>{app}</ConvexProvider>;
}
