import { absoluteUrl } from "@/lib/email/app-base-url";
import { escapeHtml } from "@/lib/email/escape-html";
import { emailTheme as t } from "@/lib/email/theme";
import { renderTransactionalEmailHtml } from "@/lib/email/templates/transactional-base";

export type OverdueBorrowerEmailParams = {
  recipientName: string | null;
  assetName: string;
  dueAtLabel: string;
  assetId: string;
};

export function buildOverdueBorrowerEmail(
  params: OverdueBorrowerEmailParams,
): { html: string; text: string; subject: string } {
  const greeting = params.recipientName
    ? `Hi ${escapeHtml(params.recipientName)},`
    : "Hi,";

  const asset = escapeHtml(params.assetName);
  const due = escapeHtml(params.dueAtLabel);

  const checkoutsUrl = absoluteUrl("/checkouts");
  const assetUrl = absoluteUrl(`/inventory/${params.assetId}`);

  const bodyInnerHtml = `<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 12px;">
  <strong style="color:${t.foreground};">${asset}</strong> was due
  <strong style="color:${t.destructive};">${due}</strong>.
</p>
<p style="margin:0;color:${t.mutedForeground};">
  Please return it or contact the lab if you need help.
</p>`;

  const html = renderTransactionalEmailHtml({
    preheader: `${params.assetName} was due ${params.dueAtLabel}. Please return or contact the lab.`,
    documentTitle: `Overdue: ${params.assetName}`,
    bodyInnerHtml,
    primaryCta:
      checkoutsUrl != null
        ? { href: checkoutsUrl, label: "View my checkouts" }
        : undefined,
    secondaryCta:
      assetUrl != null ? { href: assetUrl, label: "Open asset details" } : undefined,
  });

  const textLines = [
    params.recipientName ? `Hi ${params.recipientName},` : "Hi,",
    "",
    `${params.assetName} was due ${params.dueAtLabel}.`,
    "",
    "Please return it or contact the lab if you need help.",
    "",
    "— Lab Nexus — Vehicle Computing Lab",
  ];
  if (checkoutsUrl) {
    textLines.push("", `Checkouts: ${checkoutsUrl}`);
  }
  if (assetUrl) {
    textLines.push(`Asset: ${assetUrl}`);
  }

  return {
    subject: `[Lab Nexus] Overdue: ${params.assetName}`,
    html,
    text: textLines.join("\n"),
  };
}
