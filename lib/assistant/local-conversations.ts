export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Wire shape mirrored in API + client (conversation rows). */
export type StoredConversation = {
  id: string;
  inboxId: string;
  title: string;
  updatedAt: number;
  messages: ChatTurn[];
};

const STORAGE_KEY = "vehicle-computing-lab-assistant-chats-v1";

export const MAX_STORED_CHATS = 20;

function newClientId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function newStoredConversation(): StoredConversation {
  const id = newClientId();
  return {
    id,
    inboxId: "",
    title: "New chat",
    updatedAt: Date.now(),
    messages: [],
  };
}

export function loadConversations(): StoredConversation[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as StoredConversation[];
  } catch {
    return null;
  }
}

export function saveConversations(list: StoredConversation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
}

export function titleFromFirstUserMessage(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= 44) return t || "New chat";
  return `${t.slice(0, 41)}…`;
}

export function formatConversationTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000) return "Just now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
