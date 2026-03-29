import {
  isAiAssistantConfigured,
  isAiAssistantEnabled,
} from "@/lib/ai/config";

/** Safe, boolean-only snapshot for health JSON (no secrets). */
export function assistantHealthStatus() {
  const configured = isAiAssistantConfigured();
  const active = isAiAssistantEnabled();
  return {
    assistant: {
      /** `true` when the assistant can serve requests (key present and not disabled). */
      active,
      /** `true` when `GEMINI_API_KEY` is set (may still be inactive if `AI_ASSISTANT_ENABLED=false`). */
      configured,
    },
  } as const;
}
