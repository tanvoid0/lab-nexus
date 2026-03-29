import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantHttpRateLimit } from "@/lib/api/assistant-http-rate-limit";
import { auth } from "@/auth";
import { LAB_ROLES, assertAnyRole } from "@/lib/auth/roles";
import { inboxToWire } from "@/lib/assistant/workspace-wire";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  name: z.string().min(1).max(80),
});

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
  const inbox = await prisma.assistantInbox.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!inbox) {
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

  const name = parsed.data.name.trim().slice(0, 80);
  if (name !== inbox.name) {
    const clash = await prisma.assistantInbox.findFirst({
      where: { userId: session.user.id, name },
    });
    if (clash && clash.id !== inbox.id) {
      return NextResponse.json(
        { error: "An inbox with that name already exists." },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.assistantInbox.update({
    where: { id },
    data: { name: name || inbox.name },
  });

  return NextResponse.json({ inbox: inboxToWire(updated) });
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
  const inbox = await prisma.assistantInbox.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!inbox) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const count = await prisma.assistantInbox.count({
    where: { userId: session.user.id },
  });
  if (count <= 1) {
    return NextResponse.json(
      { error: "Keep at least one inbox. Clear chats instead." },
      { status: 400 },
    );
  }

  await prisma.assistantInbox.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
