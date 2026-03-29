import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantHttpRateLimit } from "@/lib/api/assistant-http-rate-limit";
import { auth } from "@/auth";
import { LAB_ROLES, assertAnyRole } from "@/lib/auth/roles";
import { ensureDefaultAssistantWorkspace } from "@/lib/assistant/inbox-helpers";
import {
  conversationToWire,
  inboxToWire,
} from "@/lib/assistant/workspace-wire";
import { prisma } from "@/lib/db";

const bodySchema = z.discriminatedUnion("target", [
  z.object({
    target: z.literal("inbox"),
    inboxId: z.string().min(1),
  }),
  z.object({
    target: z.literal("allConversations"),
  }),
  z.object({
    target: z.literal("resetInboxes"),
  }),
]);

export async function POST(req: Request) {
  const limited = assistantHttpRateLimit(req);
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    assertAnyRole(session.user.roles, LAB_ROLES);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const userId = session.user.id;

  if (parsed.data.target === "resetInboxes") {
    await prisma.assistantInbox.deleteMany({ where: { userId } });
  } else if (parsed.data.target === "allConversations") {
    await prisma.assistantConversation.deleteMany({
      where: { inbox: { userId } },
    });
  } else {
    const inbox = await prisma.assistantInbox.findFirst({
      where: { id: parsed.data.inboxId, userId },
    });
    if (!inbox) {
      return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
    }
    await prisma.assistantConversation.deleteMany({
      where: { inboxId: inbox.id },
    });
  }

  const inboxes = await ensureDefaultAssistantWorkspace(userId);
  const inboxIds = inboxes.map((i) => i.id);
  let conversations = await prisma.assistantConversation.findMany({
    where: { inboxId: { in: inboxIds } },
    orderBy: { updatedAt: "desc" },
    take: 400,
  });
  if (conversations.length === 0 && inboxes[0]) {
    await prisma.assistantConversation.create({
      data: { inboxId: inboxes[0].id, title: "New chat", messages: [] },
    });
    conversations = await prisma.assistantConversation.findMany({
      where: { inboxId: { in: inboxIds } },
      orderBy: { updatedAt: "desc" },
      take: 400,
    });
  }

  return NextResponse.json({
    inboxes: inboxes.map(inboxToWire),
    conversations: conversations.map(conversationToWire),
  });
}
