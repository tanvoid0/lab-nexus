"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQrcode } from "@fortawesome/free-solid-svg-icons";
import { scanPathForTrackTag } from "@/lib/nav/inventory-paths";
import { Label } from "@/components/ui/label";
import { nativeSelectClassName } from "@/lib/form/native-field-classes";
import type { ScanQrChoiceModel } from "@/lib/inventory/scan-qr-choices";

export type ScanQrPanelChoice = ScanQrChoiceModel & { qrSrc: string | null };

export function ScanQrPanelClient({
  choices,
  initialSelectedIndex,
}: {
  choices: ScanQrPanelChoice[];
  initialSelectedIndex: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const safeInitial = Math.min(
    Math.max(0, initialSelectedIndex),
    Math.max(0, choices.length - 1),
  );
  const [selectedIndex, setSelectedIndex] = useState(safeInitial);

  useEffect(() => {
    setSelectedIndex(safeInitial);
  }, [safeInitial]);

  const syncUrl = useCallback(
    (idx: number) => {
      const c = choices[idx];
      if (!c || !pathname) return;
      const params = new URLSearchParams(window.location.search);
      if (c.unitId) params.set("unit", c.unitId);
      else params.delete("unit");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [choices, pathname, router],
  );

  const selected = choices[selectedIndex];
  if (!selected) return null;

  const onSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    if (Number.isNaN(idx) || idx < 0 || idx >= choices.length) return;
    setSelectedIndex(idx);
    syncUrl(idx);
  };

  const showSelect = choices.length > 1;

  return (
    <div className="space-y-4">
      {showSelect ? (
        <div className="space-y-2">
          <Label
            htmlFor="scan-qr-target"
            className="inline-flex items-center gap-2 text-xs font-medium text-foreground"
          >
            <FontAwesomeIcon
              icon={faQrcode}
              className="size-3.5 text-muted-foreground"
            />
            Scan target
          </Label>
          <select
            id="scan-qr-target"
            value={selectedIndex}
            onChange={onSelect}
            className={nativeSelectClassName("h-auto min-h-11 sm:h-9")}
          >
            {choices.map((c, i) => (
              <option key={`${c.trackTag}-${i}`} value={i}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <p className="break-all font-mono text-xs text-muted-foreground">{selected.trackTag}</p>
      {selected.qrSrc ? (
        <a
          href={scanPathForTrackTag(selected.trackTag)}
          className="inline-flex w-fit rounded-md border border-border bg-background p-2 shadow-sm transition-colors hover:bg-muted/40"
          title="Open the same URL a scan would use"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- API returns dynamic PNG */}
          <img
            src={selected.qrSrc}
            width={144}
            height={144}
            alt={`QR code that opens this item via track tag ${selected.trackTag}`}
            className="size-36 max-w-full"
          />
        </a>
      ) : null}
      <Link
        href={scanPathForTrackTag(selected.trackTag)}
        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
      >
        Open scan link
      </Link>
    </div>
  );
}
