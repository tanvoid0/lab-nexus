import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { CartProvider } from "@/components/providers/cart-provider";
import { UserSettingsProvider } from "@/components/providers/user-settings-provider";
import { parseCartLinesFromDbJson } from "@/lib/cart/parse-cart-from-db";
import { getCachedUserSettings } from "@/lib/settings/cache";
import { prisma } from "@/lib/db";
import { hasAnyRole, LAB_ROLES } from "@/lib/auth/roles";
import { isAiAssistantEnabled } from "@/lib/ai/config";
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

  const [unreadNotifications, userSettings, userCart] = await Promise.all([
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
    getCachedUserSettings(session.user.id),
    prisma.userCart.findUnique({
      where: { userId: session.user.id },
      select: { lines: true, defaultProjectId: true },
    }),
  ]);

  const initialCartLines = parseCartLinesFromDbJson(userCart?.lines);
  const initialCartDefaultProjectId = userCart?.defaultProjectId ?? undefined;

  const labAssistantEnabled =
    isAiAssistantEnabled() && hasAnyRole(session.user.roles ?? [], LAB_ROLES);

  return (
    <UserSettingsProvider
      initialTheme={userSettings.theme}
      initialDensity={userSettings.density}
    >
      <CartProvider
        key={session.user.id}
        userId={session.user.id}
        initialLines={initialCartLines}
        initialDefaultProjectId={initialCartDefaultProjectId}
      >
      <AppShell
        user={{
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          roles: session.user.roles ?? [],
        }}
        unreadNotificationCount={unreadNotifications}
        labAssistantEnabled={labAssistantEnabled}
      >
        {children}
      </AppShell>
      </CartProvider>
    </UserSettingsProvider>
  );
}
