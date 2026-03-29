import { auth } from "@/auth";
import { AppHeader } from "@/components/layout/app-header";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const unreadNotifications = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader
        user={{
          email: session.user.email,
          name: session.user.name,
          roles: session.user.roles ?? [],
        }}
        unreadNotificationCount={unreadNotifications}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
