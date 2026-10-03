"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import React from "react";
import { IntakeProvider } from "@/components/intake/IntakeProvider";

const clients = new Map<string, ConvexReactClient>();

function convexClient(url: string) {
  const existing = clients.get(url);
  if (existing) return existing;
  const created = new ConvexReactClient(url);
  clients.set(url, created);
  return created;
}

type ProvidersProps = {
  children: React.ReactNode;
  convexUrl: string;
  persist: boolean;
};

export function Providers({ children, convexUrl, persist }: ProvidersProps) {
  const app = <IntakeProvider persist={persist}>{children}</IntakeProvider>;
  if (!convexUrl || !persist) return app;
  return (
    <ConvexProviderWithClerk client={convexClient(convexUrl)} useAuth={useAuth}>
      {app}
    </ConvexProviderWithClerk>
  );
}
