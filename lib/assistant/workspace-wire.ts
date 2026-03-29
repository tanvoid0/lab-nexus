import { parseMessagesFromJson } from "@/lib/assistant/messages-json";
import type { AssistantConversation, AssistantInbox } from "@prisma/client";

export type InboxWire = {
  id: string;
  name: string;
  sortOrder: number;
};

export type ConversationWire = {
  id: string;
  inboxId: string;
  title: string;
  updatedAt: string;
  messages: ReturnType<typeof parseMessagesFromJson>;
};

export function inboxToWire(i: AssistantInbox): InboxWire {
  return {
    id: i.id,
    name: i.name,
    sortOrder: i.sortOrder,
  };
}

export function conversationToWire(c: AssistantConversation): ConversationWire {
  return {
    id: c.id,
    inboxId: c.inboxId,
    title: c.title,
    updatedAt: c.updatedAt.toISOString(),
    messages: parseMessagesFromJson(c.messages),
  };
}
