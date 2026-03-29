import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NotificationRow } from "@/components/notifications/notification-row";
import { NotificationsEmpty } from "@/components/notifications/notifications-empty";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";

export default async function NotificationsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const hasUnread = items.some((n) => !n.read);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            In-app messages (e.g. overdue reminders from the cron job).
          </p>
        </div>
        <MarkAllReadButton disabled={!hasUnread} />
      </div>
      {items.length === 0 ? (
        <NotificationsEmpty />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <NotificationRow
              key={n.id}
              id={n.id}
              title={n.title}
              body={n.body}
              createdAtLabel={n.createdAt.toLocaleString()}
              read={n.read}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
