"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type BreadcrumbDetailContextValue = {
  detailLabel: string | null;
  setDetailLabel: (label: string | null) => void;
};

const BreadcrumbDetailContext = createContext<BreadcrumbDetailContextValue | null>(
  null,
);

export function BreadcrumbDetailProvider({ children }: { children: ReactNode }) {
  const [detailLabel, setDetailLabelState] = useState<string | null>(null);
  const setDetailLabel = useCallback((label: string | null) => {
    setDetailLabelState(label);
  }, []);

  const value = useMemo(
    () => ({ detailLabel, setDetailLabel }),
    [detailLabel, setDetailLabel],
  );

  return (
    <BreadcrumbDetailContext.Provider value={value}>
      {children}
    </BreadcrumbDetailContext.Provider>
  );
}

export function useBreadcrumbDetailContext() {
  return useContext(BreadcrumbDetailContext);
}

/** Registers a human-readable label for the current route (e.g. asset or project name). */
export function useBreadcrumbDetailLabel(label: string | null | undefined) {
  const ctx = useBreadcrumbDetailContext();
  const setDetailLabel = ctx?.setDetailLabel;

  useEffect(() => {
    if (!setDetailLabel) return;
    const next = label?.trim() || null;
    if (next) setDetailLabel(next);
    else setDetailLabel(null);
    return () => setDetailLabel(null);
  }, [label, setDetailLabel]);
}
