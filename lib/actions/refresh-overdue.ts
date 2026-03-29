"use server";

import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { markOverdueCheckouts } from "@/lib/actions/overdue";
import { revalidatePath } from "next/cache";

export type RefreshOverdueResult =
  | { ok: true; updated: number }
  | { ok: false; error: string };

/**
 * Marks past-due ACTIVE checkouts as OVERDUE (same logic as cron).
 * Admin/researcher only — use from Admin instead of running side effects on page GET.
 */
export async function refreshOverdueStatusAction(): Promise<RefreshOverdueResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in required." };
  }
  if (!hasAnyRole(session.user.roles ?? [], ["ADMIN", "RESEARCHER"])) {
    return { ok: false, error: "You cannot refresh overdue status." };
  }

  const updated = await markOverdueCheckouts();

  revalidatePath("/admin");
  revalidatePath("/checkouts");
  revalidatePath("/notifications");
  revalidatePath("/inventory", "layout");

  return { ok: true, updated };
}
