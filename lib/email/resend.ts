/**
 * Optional transactional email via [Resend](https://resend.com) HTTP API.
 * No extra npm dependency — uses `fetch`.
 *
 * Set `RESEND_API_KEY` and `EMAIL_FROM` (verified sender, e.g. `Lab <onboarding@resend.dev>`).
 */
export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim(),
  );
}

export async function sendEmailResend(
  params: SendEmailParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!key || !from) {
    return { ok: false, error: "Email not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      ok: false,
      error: `Resend ${res.status}: ${body.slice(0, 200)}`,
    };
  }

  return { ok: true };
}
