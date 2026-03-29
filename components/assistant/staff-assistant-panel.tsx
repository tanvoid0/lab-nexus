"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBroom,
  faClipboardCheck,
  faClockRotateLeft,
  faEllipsisVertical,
  faFlask,
  faFolderPlus,
  faMessage,
  faPaperPlane,
  faPlus,
  faRobot,
  faSpinner,
  faTrash,
  faTriangleExclamation,
  faUser,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import {
  formatConversationTime,
  titleFromFirstUserMessage,
  type ChatTurn,
} from "@/lib/assistant/local-conversations";
import {
  clearRiskAcknowledged,
  readRiskAcknowledged,
  writeRiskAcknowledged,
} from "@/lib/assistant/risk-ack-storage";

type InboxRow = { id: string; name: string; sortOrder: number };

type ConvRow = {
  id: string;
  inboxId: string;
  title: string;
  updatedAt: number;
  messages: ChatTurn[];
};

type WorkspaceApi = {
  inboxes: InboxRow[];
  conversations: Array<{
    id: string;
    inboxId: string;
    title: string;
    updatedAt: string;
    messages: ChatTurn[];
  }>;
};

const STARTERS = [
  "What laptops are in inventory?",
  "List my active checkouts.",
  "Search inventory for any SKU or name containing USB.",
  "What condition codes exist for assets?",
];

function mapWorkspace(data: WorkspaceApi): {
  inboxes: InboxRow[];
  conversations: ConvRow[];
} {
  return {
    inboxes: data.inboxes,
    conversations: data.conversations.map((c) => ({
      ...c,
      updatedAt: Date.parse(c.updatedAt),
    })),
  };
}

export function StaffAssistantPanel({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [inboxes, setInboxes] = useState<InboxRow[]>([]);
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [activeInboxId, setActiveInboxId] = useState<string>("");
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [riskAcked, setRiskAcked] = useState(false);

  const [newInboxName, setNewInboxName] = useState("");
  const [newInboxOpen, setNewInboxOpen] = useState(false);

  const [clearDialog, setClearDialog] = useState<
    null | "inbox" | "allConversations" | "resetInboxes"
  >(null);

  const refreshWorkspace = useCallback(async () => {
    setWorkspaceLoading(true);
    try {
      const r = await fetch("/api/assistant/workspace", {
        cache: "no-store",
      });
      if (!r.ok) {
        toast.error("Could not load assistant data.");
        return;
      }
      const raw = (await r.json()) as WorkspaceApi;
      const { inboxes: ni, conversations: nc } = mapWorkspace(raw);
      setInboxes(ni);
      setConversations(nc);
      setActiveInboxId((prev) =>
        prev && ni.some((i) => i.id === prev) ? prev : ni[0]?.id ?? "",
      );
      setActiveConversationId(null);
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void refreshWorkspace();
  }, [open, refreshWorkspace]);

  useEffect(() => {
    setRiskAcked(readRiskAcknowledged(userId));
  }, [userId]);

  useEffect(() => {
    if (!activeInboxId || !conversations.length) return;
    const inInbox = conversations.filter((c) => c.inboxId === activeInboxId);
    const sorted = [...inInbox].sort((a, b) => b.updatedAt - a.updatedAt);
    if (
      !activeConversationId ||
      !inInbox.some((c) => c.id === activeConversationId)
    ) {
      setActiveConversationId(sorted[0]?.id ?? null);
    }
  }, [activeInboxId, conversations, activeConversationId]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const messages = active?.messages ?? [];

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length) requestAnimationFrame(scrollToBottom);
  }, [messages.length, loading, scrollToBottom]);

  const sortedSidebar = useMemo(() => {
    const list = conversations.filter((c) => c.inboxId === activeInboxId);
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations, activeInboxId]);

  const patchConversation = useCallback(
    async (id: string, payload: { messages: ChatTurn[]; title?: string }) => {
      const r = await fetch(`/api/assistant/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payload.messages,
          ...(payload.title != null ? { title: payload.title } : {}),
        }),
      });
      if (!r.ok) {
        const err = (await r.json()) as { error?: string };
        throw new Error(err.error ?? "Save failed");
      }
    },
    [],
  );

  const createNewChat = useCallback(async () => {
    if (!activeInboxId) return;
    try {
      const r = await fetch("/api/assistant/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inboxId: activeInboxId }),
      });
      if (!r.ok) {
        toast.error("Could not start a new chat.");
        return;
      }
      const data = (await r.json()) as {
        conversation: {
          id: string;
          inboxId: string;
          title: string;
          updatedAt: string;
          messages: ChatTurn[];
        };
      };
      const c = data.conversation;
      const row: ConvRow = {
        id: c.id,
        inboxId: c.inboxId,
        title: c.title,
        updatedAt: Date.parse(c.updatedAt),
        messages: c.messages,
      };
      setConversations((prev) => [row, ...prev]);
      setActiveConversationId(row.id);
      toast.success("New chat ready.");
    } catch {
      toast.error("Could not start a new chat.");
    }
  }, [activeInboxId]);

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        const r = await fetch(`/api/assistant/conversations/${id}`, {
          method: "DELETE",
        });
        if (!r.ok) {
          toast.error("Could not delete chat.");
          return;
        }
        setConversations((prev) => {
          const next = prev.filter((c) => c.id !== id);
          if (activeConversationId === id) {
            const rest = next.filter((c) => c.inboxId === activeInboxId);
            const pick = [...rest].sort((a, b) => b.updatedAt - a.updatedAt)[0];
            queueMicrotask(() => setActiveConversationId(pick?.id ?? null));
          }
          return next;
        });
      } catch {
        toast.error("Could not delete chat.");
      }
    },
    [activeConversationId, activeInboxId],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || !activeConversationId || !riskAcked) return;

      const convId = activeConversationId;
      const conv = conversations.find((c) => c.id === convId);
      if (!conv) return;

      const nextMessages: ChatTurn[] = [
        ...conv.messages,
        { role: "user", content: trimmed },
      ];
      const nextTitle =
        conv.messages.length === 0
          ? titleFromFirstUserMessage(trimmed)
          : conv.title;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: nextMessages,
                title: nextTitle,
                updatedAt: Date.now(),
              }
            : c,
        ),
      );
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
        });
        const data = (await res.json()) as { reply?: string; error?: string };
        if (!res.ok) {
          toast.error(data.error ?? "Assistant request failed.");
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.slice(0, -1),
                    updatedAt: Date.now(),
                  }
                : c,
            ),
          );
          return;
        }
        const reply = data.reply;
        if (typeof reply === "string" && reply.length > 0) {
          const finalMessages: ChatTurn[] = [
            ...nextMessages,
            { role: "assistant", content: reply },
          ];
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: finalMessages,
                    title: nextTitle,
                    updatedAt: Date.now(),
                  }
                : c,
            ),
          );
          try {
            await patchConversation(convId, {
              messages: finalMessages,
              title: nextTitle,
            });
          } catch {
            toast.error("Reply saved locally but not synced—refresh the panel.");
          }
        } else {
          toast.error("Assistant returned an empty reply.");
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.slice(0, -1),
                    updatedAt: Date.now(),
                  }
                : c,
            ),
          );
        }
      } catch {
        toast.error("Network error — try again.");
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.slice(0, -1),
                  updatedAt: Date.now(),
                }
              : c,
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      activeConversationId,
      conversations,
      patchConversation,
    ],
  );

  const submitNewInbox = useCallback(async () => {
    const name = newInboxName.trim();
    if (!name) {
      toast.error("Enter an inbox name.");
      return;
    }
    try {
      const r = await fetch("/api/assistant/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!r.ok) {
        toast.error("Could not create inbox.");
        return;
      }
      const data = (await r.json()) as {
        inbox: InboxRow;
        conversation: {
          id: string;
          inboxId: string;
          title: string;
          updatedAt: string;
          messages: ChatTurn[];
        };
      };
      setInboxes((prev) =>
        [...prev, data.inbox].sort((a, b) => a.sortOrder - b.sortOrder),
      );
      const c = data.conversation;
      setConversations((prev) => [
        {
          id: c.id,
          inboxId: c.inboxId,
          title: c.title,
          updatedAt: Date.parse(c.updatedAt),
          messages: c.messages,
        },
        ...prev,
      ]);
      setActiveInboxId(data.inbox.id);
      setActiveConversationId(data.conversation.id);
      setNewInboxName("");
      setNewInboxOpen(false);
      toast.success(`Inbox “${data.inbox.name}” created.`);
    } catch {
      toast.error("Could not create inbox.");
    }
  }, [newInboxName]);

  const runClear = useCallback(async () => {
    if (!clearDialog) return;
    const body =
      clearDialog === "inbox"
        ? { target: "inbox" as const, inboxId: activeInboxId }
        : clearDialog === "allConversations"
          ? { target: "allConversations" as const }
          : { target: "resetInboxes" as const };

    try {
      const r = await fetch("/api/assistant/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        toast.error("Could not clear data.");
        return;
      }
      const data = (await r.json()) as WorkspaceApi;
      const mapped = mapWorkspace(data);
      setInboxes(mapped.inboxes);
      setConversations(mapped.conversations);
      setActiveInboxId(mapped.inboxes[0]?.id ?? "");
      const first = mapped.conversations
        .filter((c) => c.inboxId === mapped.inboxes[0]?.id)
        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setActiveConversationId(first?.id ?? null);
      toast.success("Assistant data updated.");
    } catch {
      toast.error("Could not clear data.");
    } finally {
      setClearDialog(null);
    }
  }, [clearDialog, activeInboxId]);

  const workspaceReady =
    !workspaceLoading && inboxes.length > 0 && activeInboxId.length > 0;

  const canUseComposer =
    riskAcked && workspaceReady && activeConversationId != null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-11 w-11 shrink-0 border-border shadow-sm transition-shadow hover:shadow-md sm:h-9 sm:w-9"
          aria-label="Open lab assistant"
        >
          <FontAwesomeIcon icon={faRobot} className="size-4 text-primary opacity-90" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className={cn(
          "left-auto right-0 flex h-[100dvh] max-h-[100dvh] flex-col gap-0 overflow-hidden border-l border-border/60 bg-background p-0 shadow-2xl",
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
          historyOpen
            ? "w-[min(100vw,28rem)] sm:w-[min(100vw,44rem)]"
            : "w-[min(100vw,26rem)] sm:w-[min(100vw,32rem)]",
        )}
      >
        <TooltipProvider delayDuration={400}>
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              historyOpen && "sm:flex-row",
            )}
          >
            {historyOpen ? (
              <aside
                className={cn(
                  "flex max-h-[42vh] shrink-0 flex-col border-b border-border/50 bg-muted/25 sm:max-h-none sm:w-[14rem] sm:border-b-0 sm:border-r",
                )}
              >
                <div className="space-y-2 border-b border-border/40 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Inbox
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 sm:hidden"
                          onClick={() => setHistoryOpen(false)}
                          aria-label="Hide side panel"
                        >
                          <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Hide panel</TooltipContent>
                    </Tooltip>
                  </div>
                  <label className="sr-only" htmlFor="assistant-inbox-select">
                    Active inbox
                  </label>
                  <select
                    id="assistant-inbox-select"
                    value={activeInboxId}
                    disabled={!workspaceReady}
                    onChange={(e) => setActiveInboxId(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-border/80 bg-background px-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {inboxes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-full gap-1.5 text-xs"
                    disabled={workspaceLoading}
                    onClick={() => setNewInboxOpen(true)}
                  >
                    <FontAwesomeIcon icon={faFolderPlus} className="size-3.5" />
                    New inbox
                  </Button>
                </div>
                <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Chats
                  </span>
                </div>
                <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-2">
                  {sortedSidebar.map((c) => (
                    <div
                      key={c.id}
                      className={cn(
                        "group relative flex w-full rounded-xl transition-colors",
                        c.id === activeConversationId
                          ? "bg-primary/12 ring-1 ring-primary/25"
                          : "hover:bg-muted/60",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveConversationId(c.id)}
                        className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2.5 text-left"
                      >
                        <span className="truncate text-sm font-medium text-foreground">
                          {c.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatConversationTime(c.updatedAt)}
                          {c.messages.length
                            ? ` · ${c.messages.length} msgs`
                            : ""}
                        </span>
                      </button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 size-8 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                            aria-label={`Delete ${c.title}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              void deleteConversation(c.id);
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faTrash}
                              className="size-3.5 text-destructive"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete chat</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                  {sortedSidebar.length === 0 && workspaceReady ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No chats in this inbox. Start one with +.
                    </p>
                  ) : null}
                </div>
              </aside>
            ) : null}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <header
                className={cn(
                  "shrink-0 bg-gradient-to-br from-primary via-primary to-primary/85 px-4 pb-4 pt-3 text-primary-foreground shadow-sm",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm">
                    <FontAwesomeIcon icon={faRobot} className="size-5 opacity-95" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <SheetTitle className="text-left text-lg font-semibold leading-tight tracking-tight text-primary-foreground">
                        Lab assistant
                      </SheetTitle>
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-white/35 bg-white/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm backdrop-blur-sm"
                        title="This assistant is experimental"
                      >
                        <FontAwesomeIcon icon={faFlask} className="size-2.5 opacity-95" />
                        Experimental
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-snug text-primary-foreground/80">
                      Chats sync to your account. Use inboxes to separate topics.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {!historyOpen ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="size-9 border-0 bg-white/15 text-primary-foreground hover:bg-white/25"
                            onClick={() => setHistoryOpen(true)}
                            aria-label="Show chat history"
                          >
                            <FontAwesomeIcon
                              icon={faClockRotateLeft}
                              className="size-4"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">History</TooltipContent>
                      </Tooltip>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="size-9 border-0 bg-white/15 text-primary-foreground hover:bg-white/25"
                          aria-label="Clear and data options"
                        >
                          <FontAwesomeIcon
                            icon={faEllipsisVertical}
                            className="size-4"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={() => setClearDialog("inbox")}
                        >
                          <FontAwesomeIcon icon={faBroom} className="size-3.5" />
                          Clear chats in this inbox
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={() => setClearDialog("allConversations")}
                        >
                          <FontAwesomeIcon icon={faTrash} className="size-3.5" />
                          Clear all chats (all inboxes)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onSelect={() => setClearDialog("resetInboxes")}
                        >
                          <FontAwesomeIcon icon={faXmark} className="size-3.5" />
                          Reset inboxes…
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="secondary"
                          className="size-9 border-0 bg-white/15 text-primary-foreground hover:bg-white/25"
                          onClick={() => void createNewChat()}
                          aria-label="New chat"
                        >
                          <FontAwesomeIcon icon={faPlus} className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">New chat</TooltipContent>
                    </Tooltip>
                    {historyOpen ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="hidden size-9 border-0 bg-white/15 text-primary-foreground hover:bg-white/25 sm:inline-flex"
                            onClick={() => setHistoryOpen(false)}
                            aria-label="Widen chat"
                          >
                            <FontAwesomeIcon icon={faMessage} className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Focus chat</TooltipContent>
                      </Tooltip>
                    ) : null}
                    <SheetClose asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="size-9 border-0 bg-white/15 text-primary-foreground hover:bg-white/25"
                        aria-label="Close assistant"
                      >
                        <FontAwesomeIcon icon={faXmark} className="size-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </header>

              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-muted/15 to-background px-4 py-4"
              >
                {workspaceLoading ? (
                  <div className="flex justify-center py-12 text-sm text-muted-foreground">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="size-5 animate-spin text-primary"
                    />
                  </div>
                ) : !activeConversationId ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No conversation selected. Create a new chat.
                  </p>
                ) : messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <FontAwesomeIcon
                          icon={faWandMagicSparkles}
                          className="size-4 text-primary"
                        />
                        Quick starts
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Tap a prompt or type your own below.
                      </p>
                      {!riskAcked ? (
                        <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 text-xs text-muted-foreground dark:border-amber-400/15">
                          <FontAwesomeIcon
                            icon={faTriangleExclamation}
                            className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                          />
                          <span>
                            Accept the experimental-use notice below (checkbox) to use starters or send
                            messages.
                          </span>
                        </p>
                      ) : null}
                    </div>
                    <ul className="flex flex-col gap-2">
                      {STARTERS.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            disabled={loading || !riskAcked}
                            onClick={() => void send(s)}
                            className={cn(
                              "w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-left text-sm text-foreground shadow-sm",
                              "transition-all hover:border-primary/35 hover:bg-primary/5 hover:shadow-md",
                              "disabled:pointer-events-none disabled:opacity-50",
                            )}
                          >
                            {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={`${m.role}-${i}-${m.content.length}`}
                      className={cn(
                        "flex gap-2.5",
                        m.role === "user" ? "flex-row-reverse" : "flex-row",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full text-xs shadow-sm",
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border border-border/80 bg-background text-primary",
                        )}
                        aria-hidden
                      >
                        <FontAwesomeIcon
                          icon={m.role === "user" ? faUser : faRobot}
                          className="size-3.5 opacity-90"
                        />
                      </div>
                      <div
                        className={cn(
                          "max-w-[min(100%,20rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[min(100%,24rem)]",
                          m.role === "user"
                            ? "rounded-tr-md bg-primary text-primary-foreground"
                            : "rounded-tl-md border border-border/70 bg-card text-card-foreground",
                        )}
                      >
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </div>
                  ))
                )}
                {loading ? (
                  <div className="flex items-center gap-2 pl-1 text-sm text-muted-foreground">
                    <FontAwesomeIcon
                      icon={faSpinner}
                      className="size-4 animate-spin text-primary"
                    />
                    <span>Assistant is thinking…</span>
                  </div>
                ) : null}
              </div>

              <footer className="shrink-0 border-t border-border/60 bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
                <div className="mb-2 flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[11px] leading-snug text-muted-foreground dark:border-amber-400/20 dark:bg-amber-500/10">
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                  />
                  <span>
                    <strong className="font-semibold text-foreground/90">Experimental.</strong>{" "}
                    Answers may be wrong, incomplete, or out of date. Tools are read-only—always
                    confirm important details in the app. Your choice below is remembered on this device
                    for your account.
                  </span>
                </div>
                <label
                  htmlFor="assistant-risk-ack"
                  className="mb-2 flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/70 bg-muted/25 px-3 py-2.5 text-[11px] leading-snug text-foreground shadow-sm"
                >
                  <input
                    id="assistant-risk-ack"
                    type="checkbox"
                    checked={riskAcked}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setRiskAcked(next);
                      if (next) writeRiskAcknowledged(userId);
                      else clearRiskAcknowledged(userId);
                    }}
                    className="mt-0.5 size-4 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  />
                  <span className="flex min-w-0 flex-1 gap-2">
                    <FontAwesomeIcon
                      icon={faClipboardCheck}
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span>
                      I understand this assistant is experimental, replies may be unreliable, and I use
                      it at my own risk.
                    </span>
                  </span>
                </label>
                <form
                  className="flex gap-2 rounded-2xl border-2 border-border/50 bg-muted/20 p-1.5 transition-[border-color,box-shadow] focus-within:border-primary/40 focus-within:shadow-md"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(input);
                  }}
                >
                  <label htmlFor="assistant-input" className="sr-only">
                    Message to assistant
                  </label>
                  <textarea
                    id="assistant-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about inventory or your loans…"
                    rows={2}
                    disabled={loading || !canUseComposer}
                    className="min-h-[2.75rem] flex-1 resize-none rounded-xl border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send(input);
                      }
                    }}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        size="icon"
                        className="size-11 shrink-0 self-end rounded-xl shadow-sm"
                        disabled={loading || !input.trim() || !canUseComposer}
                        aria-label="Send message"
                      >
                        <FontAwesomeIcon icon={faPaperPlane} className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Send</TooltipContent>
                  </Tooltip>
                </form>
              </footer>
            </div>
          </div>
        </TooltipProvider>
      </SheetContent>

      <AlertDialog open={newInboxOpen} onOpenChange={setNewInboxOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>New inbox</AlertDialogTitle>
            <AlertDialogDescription>
              Inboxes keep unrelated conversations apart (e.g. &quot;Thesis project&quot; vs
              &quot;Lab kitting&quot;). Names must be unique for your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newInboxName}
            onChange={(e) => setNewInboxName(e.target.value)}
            placeholder="Inbox name"
            maxLength={80}
            className="mt-2"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submitNewInbox();
              }
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitNewInbox()}>
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={clearDialog != null}
        onOpenChange={(v) => !v && setClearDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clearDialog === "inbox"
                ? "Clear chats in this inbox?"
                : clearDialog === "allConversations"
                  ? "Clear all chats?"
                  : "Reset all inboxes?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearDialog === "inbox"
                ? "All threads in the current inbox will be removed. Your other inboxes stay as they are."
                : clearDialog === "allConversations"
                  ? "Every chat thread in every inbox will be deleted. Inboxes remain; we will give you a fresh starter chat."
                  : "All inboxes and chats will be deleted, then a single General inbox will be created again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void runClear()}
            >
              {clearDialog === "resetInboxes" ? "Reset" : "Clear"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
