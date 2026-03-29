"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartLine } from "@/lib/cart/types";
import { syncUserCartAction } from "@/lib/actions/user-cart";

type CartContextValue = {
  lines: CartLine[];
  defaultProjectId: string | undefined;
  itemCount: number;
  hydrated: boolean;
  addLine: (line: Omit<CartLine, "projectId"> & { projectId?: string }) => void;
  removeLine: (assetId: string, assetUnitId?: string) => void;
  setLineProject: (assetId: string, assetUnitId: string | undefined, projectId: string | undefined) => void;
  setDefaultProject: (projectId: string | undefined) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(assetId: string, assetUnitId?: string) {
  return `${assetId}:${assetUnitId ?? ""}`;
}

const SYNC_DEBOUNCE_MS = 450;

export function CartProvider({
  userId,
  initialLines,
  initialDefaultProjectId,
  children,
}: {
  userId: string;
  initialLines: CartLine[];
  initialDefaultProjectId?: string | null;
  children: React.ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>(() => initialLines);
  const [defaultProjectId, setDefaultProjectIdState] = useState<string | undefined>(
    () => initialDefaultProjectId ?? undefined,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const linesRef = useRef(lines);
  const defaultRef = useRef(defaultProjectId);
  linesRef.current = lines;
  defaultRef.current = defaultProjectId;

  useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(() => {
      void syncUserCartAction({
        lines: linesRef.current,
        defaultProjectId: defaultRef.current ?? null,
      });
    }, SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [lines, defaultProjectId, hydrated, userId]);

  const addLine = useCallback(
    (line: Omit<CartLine, "projectId"> & { projectId?: string }) => {
      setLines((prev) => {
        const key = lineKey(line.assetId, line.assetUnitId);
        const next = prev.filter(
          (l) => lineKey(l.assetId, l.assetUnitId) !== key,
        );
        next.push({
          assetId: line.assetId,
          assetUnitId: line.assetUnitId,
          name: line.name,
          skuOrInternalId: line.skuOrInternalId,
          projectId: line.projectId,
        });
        return next;
      });
    },
    [],
  );

  const removeLine = useCallback((assetId: string, assetUnitId?: string) => {
    setLines((prev) =>
      prev.filter((l) => lineKey(l.assetId, l.assetUnitId) !== lineKey(assetId, assetUnitId)),
    );
  }, []);

  const setLineProject = useCallback(
    (assetId: string, assetUnitId: string | undefined, projectId: string | undefined) => {
      setLines((prev) =>
        prev.map((l) =>
          lineKey(l.assetId, l.assetUnitId) === lineKey(assetId, assetUnitId)
            ? { ...l, projectId: projectId || undefined }
            : l,
        ),
      );
    },
    [],
  );

  const setDefaultProject = useCallback((projectId: string | undefined) => {
    setDefaultProjectIdState(projectId || undefined);
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
    setDefaultProjectIdState(undefined);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      defaultProjectId,
      itemCount: lines.length,
      hydrated,
      addLine,
      removeLine,
      setLineProject,
      setDefaultProject,
      clearCart,
    }),
    [
      lines,
      defaultProjectId,
      hydrated,
      addLine,
      removeLine,
      setLineProject,
      setDefaultProject,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
