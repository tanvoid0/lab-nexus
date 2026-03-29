/**
 * Parses comma-separated email domain allowlists from env (e.g. LDAP / IdP alignment).
 * When the parsed list is non-empty, sign-in email hosts must match one entry
 * (exact host or subdomain suffix).
 */
export function parseAllowedEmailDomains(raw: string | undefined): string[] {
  if (raw == null || !raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** True if `email`'s domain equals `allowed` or is a subdomain of it (e.g. cs.uni.edu vs uni.edu). */
export function emailDomainMatchesAllowed(emailHost: string, allowed: string): boolean {
  const host = emailHost.toLowerCase();
  const domain = allowed.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}

export function isEmailFromAllowedDomains(email: string, allowedDomains: string[]): boolean {
  if (allowedDomains.length === 0) return true;
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return false;
  const host = email.slice(at + 1);
  return allowedDomains.some((d) => emailDomainMatchesAllowed(host, d));
}
