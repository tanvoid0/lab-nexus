import { inventoryTrackTagQrPngHref } from "@/lib/qr/inventory-track-tag-target";
import { resolveAppOriginForPublicUrl } from "@/lib/request-origin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScanQrInfoTrigger } from "@/components/inventory/scan-qr-info-trigger";
import { ScanQrPanelClient } from "@/components/inventory/scan-qr-panel-client";
import type { ScanQrChoiceModel } from "@/lib/inventory/scan-qr-choices";

export type { ScanQrChoiceModel };

export async function ScanQrPanel({
  choices,
  initialSelectedIndex,
}: {
  choices: ScanQrChoiceModel[];
  initialSelectedIndex: number;
}) {
  const originConfigured = (await resolveAppOriginForPublicUrl()) != null;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="text-lg text-primary">Scan &amp; QR</CardTitle>
        <ScanQrInfoTrigger />
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {choices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a <span className="font-medium text-foreground">track tag</span> on the asset (edit) or on
            a unit below for scan links and QR codes.
          </p>
        ) : !originConfigured ? (
          <>
            <p className="text-sm text-muted-foreground">
              Could not determine a public URL for phone QRs (no Host header and no{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXTAUTH_URL</code> /{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">APP_URL</code>).{" "}
              <span className="font-medium text-foreground">Open scan link</span> still works in this
              browser; the code below encodes the same path without an absolute payload.
            </p>
            <ScanQrPanelClient
              choices={choices.map((c) => ({ ...c, qrSrc: null }))}
              initialSelectedIndex={initialSelectedIndex}
            />
          </>
        ) : (
          <ScanQrPanelClient
            choices={await Promise.all(
              choices.map(async (c) => ({
                ...c,
                qrSrc: await inventoryTrackTagQrPngHref(c.trackTag),
              })),
            )}
            initialSelectedIndex={initialSelectedIndex}
          />
        )}
      </CardContent>
    </Card>
  );
}
