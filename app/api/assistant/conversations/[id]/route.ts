import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantHttpRateLimit } from "@/lib/api/assistant-http-rate-limit";
import { auth } from "@/auth";
import { LAB_ROLES, assertAnyRole } from "@/lib/auth/roles";
import { messagesForDb } from "@/lib/assistant/messages-json";
import { conversationToWire } from "@/lib/assistant/workspace-wire";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(24_000),
      }),
    )
    .max(100),
});

function conversationForUser(id: string, userId: string) {
  return prisma.assistantConversation.findFirst({
    where: { id, inbox: { userId } },
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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

  const { id } = await ctx.params;
  const existing = await conversationForUser(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const dbMessages = messagesForDb(parsed.data.messages);
  const updated = await prisma.assistantConversation.update({
    where: { id },
    data: {
      ...(parsed.data.title != null ? { title: parsed.data.title } : {}),
      messages: dbMessages,
    },
  });

  return NextResponse.json({ conversation: conversationToWire(updated) });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
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

  const { id } = await ctx.params;
  const existing = await conversationForUser(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.assistantConversation.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
