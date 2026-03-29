import { prisma } from "@/lib/db";

const DEFAULT_INBOX_NAME = "General";

export async function ensureDefaultAssistantWorkspace(userId: string) {
  let inboxes = await prisma.assistantInbox.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (inboxes.length === 0) {
    await prisma.assistantInbox.create({
      data: {
        userId,
        name: DEFAULT_INBOX_NAME,
        sortOrder: 0,
      },
    });
    inboxes = await prisma.assistantInbox.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }
  return inboxes;
}

export async function uniqueInboxNameForUser(
  userId: string,
  base: string,
): Promise<string> {
  const trimmed = base.trim().slice(0, 80) || DEFAULT_INBOX_NAME;
  let name = trimmed;
  let n = 2;
  while (
    await prisma.assistantInbox.findFirst({ where: { userId, name } })
  ) {
    const suffix = ` (${n})`;
    name = (trimmed.slice(0, Math.max(1, 80 - suffix.length)) + suffix).slice(
      0,
      80,
    );
    n++;
  }
  return name;
}

export async function nextInboxSortOrder(userId: string): Promise<number> {
  const agg = await prisma.assistantInbox.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });
  return (agg._max.sortOrder ?? -1) + 1;
}
