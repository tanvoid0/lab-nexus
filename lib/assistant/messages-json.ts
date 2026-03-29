import type { ChatTurn } from "@/lib/assistant/local-conversations";

export const MAX_MESSAGES_PER_CONVERSATION = 100;

export function parseMessagesFromJson(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  const out: ChatTurn[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (o.role !== "user" && o.role !== "assistant") continue;
    if (typeof o.content !== "string") continue;
    out.push({ role: o.role, content: o.content });
  }
  return out.slice(-MAX_MESSAGES_PER_CONVERSATION);
}

export function messagesForDb(messages: ChatTurn[]): ChatTurn[] {
  return messages.slice(-MAX_MESSAGES_PER_CONVERSATION);
}
