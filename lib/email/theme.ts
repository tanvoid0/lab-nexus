/**
 * Email palette — mirrors `app/globals.css` `:root` (light) for branded transactional mail.
 * Keep in sync when design tokens change; email cannot consume CSS variables at send time.
 */
export const emailTheme = {
  background: "#ffffff",
  foreground: "#1a1a1a",
  primary: "#144733",
  primaryForeground: "#ffffff",
  muted: "#f0f4f2",
  mutedForeground: "#4a5c55",
  border: "#d4e0db",
  accent: "#8b7355",
  destructive: "#b91c1c",
  secondary: "#f7f9f8",
} as const;
