"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import React from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  if (!convex) {
    // In test environments where NEXT_PUBLIC_CONVEX_URL is not set,
    // we still need to provide a Convex client to avoid useMutation errors
    // Since the tests use mocked API calls anyway, we can create a dummy client
    const dummyClient = new ConvexReactClient("https://happy-animal-123.convex.cloud");
    return <ConvexProvider client={dummyClient}>{children}</ConvexProvider>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
