/**
 * Optional AI assistant (see plan.md — Gemini + tool registry).
 * Disabled when no API key, or when explicitly turned off.
 */
export function isAiAssistantConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** When false, assistant UI and API return a clear “not enabled” state. */
export function isAiAssistantEnabled(): boolean {
  if (process.env.AI_ASSISTANT_ENABLED === "false") return false;
  return isAiAssistantConfigured();
}

export function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

export const AI_CHAT_TIMEOUT_MS = Math.min(
  Math.max(Number(process.env.GEMINI_REQUEST_TIMEOUT_MS) || 45_000, 5_000),
  120_000,
);

export const AI_MAX_TOOL_ROUNDS = 5;

/** Fixed window for AI chat rate limits (in-memory per process; see `lib/rate-limit.ts`). */
export const AI_CHAT_RATE_WINDOW_MS = 60_000;

function aiChatLimitFromEnv(
  raw: string | undefined,
  fallback: number,
  cap: number,
): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  if (i < 1) return fallback;
  return Math.min(i, cap);
}

/**
 * Max Gemini chat requests per signed-in user per window. Default is intentionally very low to cap cost.
 * Override with `AI_CHAT_MAX_PER_USER_PER_MIN` (integer ≥ 1, capped at 120).
 */
export function getAiChatMaxPerUserPerWindow(): number {
  return aiChatLimitFromEnv(
    process.env.AI_CHAT_MAX_PER_USER_PER_MIN,
    3,
    120,
  );
}

/**
 * Max Gemini chat requests per client IP per window (shared NAT). Default low; cap 300.
 * Override with `AI_CHAT_MAX_PER_IP_PER_MIN`.
 */
export function getAiChatMaxPerIpPerWindow(): number {
  return aiChatLimitFromEnv(process.env.AI_CHAT_MAX_PER_IP_PER_MIN, 8, 300);
}

/** User-visible copy when over limit (HTTP 429). */
export const AI_CHAT_RATE_LIMIT_MESSAGE =
  "Lab assistant usage limit reached. Wait a bit and try again.";
