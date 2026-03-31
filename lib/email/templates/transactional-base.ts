import { emailTheme as t } from "@/lib/email/theme";
import { escapeHtml } from "@/lib/email/escape-html";

export type TransactionalCta = {
  href: string;
  label: string;
};

/**
 * Shared shell: preheader, presentation tables, VCL-aligned header/footer, optional bulletproof CTA.
 * Pass only trusted HTML in `bodyInnerHtml` (compose user-facing strings with `escapeHtml`).
 */
export function renderTransactionalEmailHtml(opts: {
  preheader: string;
  documentTitle: string;
  bodyInnerHtml: string;
  primaryCta?: TransactionalCta;
  secondaryCta?: TransactionalCta;
}): string {
  const pre = escapeHtml(opts.preheader);
  const docTitle = escapeHtml(opts.documentTitle);

  const ctaBlock = renderCtaBlock(opts.primaryCta, opts.secondaryCta);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${docTitle}</title>
  <!--[if mso]><style type="text/css">table, td { border-collapse: collapse; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${t.secondary};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${t.secondary};opacity:0;">
    ${pre}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${t.secondary};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:${t.background};border:1px solid ${t.border};border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:${t.primary};padding:20px 24px;">
              <p style="margin:0;font-size:18px;font-weight:600;color:${t.primaryForeground};letter-spacing:-0.02em;">
                Vehicle Computing Lab
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:${t.primaryForeground};opacity:0.9;">
                Equipment inventory and checkout
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;color:${t.foreground};font-size:15px;line-height:1.55;">
              ${opts.bodyInnerHtml}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;border-top:1px solid ${t.border};background-color:${t.muted};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${t.mutedForeground};">
                Vehicle Computing Lab
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderCtaBlock(
  primary?: TransactionalCta,
  secondary?: TransactionalCta,
): string {
  if (!primary && !secondary) return "";

  const rows: string[] = [];

  if (primary) {
    const href = escapeHtml(primary.href);
    const label = escapeHtml(primary.label);
    rows.push(`<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 0;">
  <tr>
    <td style="border-radius:6px;background-color:${t.primary};">
      <a href="${href}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:${t.primaryForeground};text-decoration:none;border-radius:6px;">
        ${label}
      </a>
    </td>
  </tr>
</table>
<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${t.mutedForeground};">
  Or open this link: <a href="${href}" style="color:${t.primary};word-break:break-all;">${href}</a>
</p>`);
  }

  if (secondary) {
    const href = escapeHtml(secondary.href);
    const label = escapeHtml(secondary.label);
    rows.push(`<p style="margin:16px 0 0;font-size:14px;line-height:1.5;">
  <a href="${href}" style="color:${t.primary};font-weight:500;">${label}</a>
</p>`);
  }

  return rows.join("\n");
}
