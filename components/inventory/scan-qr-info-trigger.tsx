"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Explains how track-tag scan links and QR codes relate to this asset (not SKU / DB id).
 */
export function ScanQrInfoTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="How scan and QR work"
        >
          <FontAwesomeIcon icon={faCircleInfo} className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="space-y-2 text-left text-xs leading-relaxed">
        <p className="font-medium text-popover-foreground">Scan &amp; QR</p>
        <p>
          <span className="font-medium text-foreground">Open scan link</span> and the QR code use the
          selected <span className="font-medium text-foreground">track tag</span> (asset or unit), not the
          SKU or internal database id.
        </p>
        <p>
          The <span className="font-medium text-foreground">path</span> is always{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">/scan/…</code> (same app on any
          domain). The <span className="font-medium text-foreground">hostname</span> in the QR matches the
          site you&apos;re using now, or <code className="text-[11px]">APP_URL</code> / auth URL when there
          is no browser request.
        </p>
        <p>
          Opening a scan link goes to <code className="text-[11px]">/scan/…</code> first; the server
          resolves the tag, then <span className="font-medium text-foreground">redirects to this asset&apos;s
          detail page</span>{" "}
          (<code className="text-[11px]">/inventory/&lt;id&gt;</code>, with{" "}
          <code className="text-[11px]">?unit=…</code> when the tag belongs to a single unit). That hop
          exists so labels and QR codes can use{" "}
          <span className="font-medium text-foreground">track tags</span> instead of database IDs.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
