import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantHttpRateLimit } from "@/lib/api/assistant-http-rate-limit";
import { auth } from "@/auth";
import { LAB_ROLES, assertAnyRole } from "@/lib/auth/roles";
import { conversationToWire } from "@/lib/assistant/workspace-wire";
import { prisma } from "@/lib/db";

const postSchema = z.object({
  inboxId: z.string().min(1),
});

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
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const inbox = await prisma.assistantInbox.findFirst({
    where: { id: parsed.data.inboxId, userId: session.user.id },
  });
  if (!inbox) {
    return NextResponse.json({ error: "Inbox not found" }, { status: 404 });
  }

  const conversation = await prisma.assistantConversation.create({
    data: {
      inboxId: inbox.id,
      title: "New chat",
      messages: [],
    },
  });

  return NextResponse.json({ conversation: conversationToWire(conversation) });
}
