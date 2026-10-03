"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import React from "react";

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
};

export function Providers({ children, convexUrl }: ProvidersProps) {
  if (!convexUrl) return children;
  return (
    <ConvexProviderWithClerk client={convexClient(convexUrl)} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
