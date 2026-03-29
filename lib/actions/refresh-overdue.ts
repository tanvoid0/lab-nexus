"use server";

import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
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
  if (!hasAnyRole(session.user.roles ?? [], LAB_ROLES_STAFF)) {
    return { ok: false, error: "You cannot refresh overdue status." };
  }

  const updated = await markOverdueCheckouts({ actorUserId: session.user.id });

  revalidatePath("/admin");
  revalidatePath("/checkouts");
  revalidatePath("/notifications");
  revalidatePath("/inventory", "layout");

  return { ok: true, updated };
}
