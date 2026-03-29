import { NextResponse } from "next/server";
import { assistantHttpRateLimit } from "@/lib/api/assistant-http-rate-limit";
import { ensureDefaultAssistantWorkspace } from "@/lib/assistant/inbox-helpers";
import { auth } from "@/auth";
import { LAB_ROLES, assertAnyRole } from "@/lib/auth/roles";
import {
  conversationToWire,
  inboxToWire,
} from "@/lib/assistant/workspace-wire";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
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

  const inboxes = await ensureDefaultAssistantWorkspace(session.user.id);
  const inboxIds = inboxes.map((i) => i.id);
  let conversations = await prisma.assistantConversation.findMany({
    where: { inboxId: { in: inboxIds } },
    orderBy: { updatedAt: "desc" },
    take: 400,
  });
  if (conversations.length === 0 && inboxes[0]) {
    await prisma.assistantConversation.create({
      data: {
        inboxId: inboxes[0].id,
        title: "New chat",
        messages: [],
      },
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
