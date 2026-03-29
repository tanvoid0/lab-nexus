import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  AI_CHAT_TIMEOUT_MS,
  getGeminiModelId,
  isAiAssistantConfigured,
} from "@/lib/ai/config";
import { LAB_ASSISTANT_SYSTEM_INSTRUCTION } from "@/lib/ai/system-prompt";

export type GeminiLogLevel = "debug" | "info" | "warn" | "error";

export type GeminiClientHooks = {
  log?: (level: GeminiLogLevel, message: string, meta?: Record<string, unknown>) => void;
};

function defaultLog(
  level: GeminiLogLevel,
  message: string,
  meta?: Record<string, unknown>,
) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const fn =
    level === "error"
      ? console.error
      : level === "warn"
        ? console.warn
        : console.log;
  fn(`[gemini] ${message}`, meta ?? "");
}

export function getGenerativeModelForStaffAssistant(
  hooks: GeminiClientHooks = {},
) {
  const log = hooks.log ?? defaultLog;
  if (!isAiAssistantConfigured()) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const apiKey = process.env.GEMINI_API_KEY!.trim();
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelId = getGeminiModelId();
  log("info", "getGenerativeModel", { modelId });

  return genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: LAB_ASSISTANT_SYSTEM_INSTRUCTION,
  });
}

export function geminiRequestSignal(): AbortSignal {
  return AbortSignal.timeout(AI_CHAT_TIMEOUT_MS);
}

export async function withGeminiRetries<T>(
  run: () => Promise<T>,
  hooks: GeminiClientHooks = {},
): Promise<T> {
  const log = hooks.log ?? defaultLog;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await run();
    } catch (e) {
      lastErr = e;
      log("warn", "generate attempt failed", { attempt });
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }
  throw lastErr;
}
