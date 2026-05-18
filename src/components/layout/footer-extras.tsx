"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type FooterExtrasContextValue = {
  extras: ReactNode;
  setExtras: (node: ReactNode) => void;
};

const FooterExtrasContext = createContext<FooterExtrasContextValue | null>(null);

export function FooterExtrasProvider({ children }: { children: ReactNode }) {
  const [extras, setExtras] = useState<ReactNode>(null);
  return (
    <FooterExtrasContext.Provider value={{ extras, setExtras }}>
      {children}
    </FooterExtrasContext.Provider>
  );
}

export function FooterExtras({ children }: { children: ReactNode }) {
  const ctx = useContext(FooterExtrasContext);
  if (!ctx) return null;

  const { setExtras } = ctx;
  useEffect(() => {
    setExtras(children);
    return () => setExtras(null);
  }, [children, setExtras]);

  return null;
}

export function useFooterExtras() {
  return useContext(FooterExtrasContext)?.extras ?? null;
}
