"use client";

import { createContext, useContext } from "react";

type RuntimeConfig = {
  clerk: boolean;
  convex: boolean;
};

const RuntimeConfigContext = createContext<RuntimeConfig>({ clerk: false, convex: false });

export function RuntimeConfigProvider({
  clerk,
  convex,
  children,
}: RuntimeConfig & { children: React.ReactNode }) {
  return (
    <RuntimeConfigContext.Provider value={{ clerk, convex }}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  return useContext(RuntimeConfigContext);
}
