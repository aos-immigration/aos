"use client";

import { createContext, useContext } from "react";

const IntakeModeContext = createContext(false);

export function IntakeModeProvider({
  demo,
  children,
}: {
  demo: boolean;
  children: React.ReactNode;
}) {
  return <IntakeModeContext.Provider value={demo}>{children}</IntakeModeContext.Provider>;
}

export function useDemoMode() {
  return useContext(IntakeModeContext);
}
