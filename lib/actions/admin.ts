"use server";

import { auth } from "@/auth";
import { assertAnyRole } from "@/lib/auth/roles";
import {
  failure,
  success,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1).max(200),
});

const locationSchema = z.object({
  name: z.string().min(1).max(200),
});

export async function createCategoryAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, ["ADMIN", "RESEARCHER"]);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  try {
    await prisma.assetCategory.create({ data: { name: parsed.data.name.trim() } });
    revalidatePath("/admin");
    revalidatePath("/inventory");
    return success();
  } catch {
    return failure({ formError: "Category name may already exist." });
  }
}

export async function createLocationAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  try {
    assertAnyRole(session.user.roles, ["ADMIN", "RESEARCHER"]);
  } catch {
    return failure({ formError: "Forbidden." });
  }
  const parsed = locationSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }
  try {
    await prisma.location.create({ data: { name: parsed.data.name.trim() } });
    revalidatePath("/admin");
    revalidatePath("/inventory");
    return success();
  } catch {
    return failure({ formError: "Location name may already exist." });
  }
}
