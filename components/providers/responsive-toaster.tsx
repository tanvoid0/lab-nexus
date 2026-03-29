"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function ResponsiveToaster() {
  const [position, setPosition] = useState<"top-center" | "bottom-center">(
    "bottom-center",
  );

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => {
      setPosition(mq.matches ? "top-center" : "bottom-center");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return <Toaster richColors position={position} closeButton />;
}
