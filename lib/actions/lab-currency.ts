"use server";

import { auth } from "@/auth";
import { hasRole, LAB_ROLE } from "@/lib/auth/roles";
import {
  failure,
  success,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  LAB_CURRENCY_CONFIG_ID,
  isValidIso4217Code,
  normalizeAdditionalTransactionCodes,
  parseCurrencyCodesList,
  revalidateLabCurrencyConfigCache,
  resolveLabCurrencyConfig,
  type LabCurrencyResolved,
} from "@/lib/currency";
import { labCurrencyConfigFormSchema } from "@/lib/schemas/lab-currency";

/**
 * Persists lab-wide currency policy. **ADMIN only** — enforced here on every call;
 * UI routes are not a security boundary.
 */
export async function updateLabCurrencyConfigAction(
  _prev: ActionResult<{ config: LabCurrencyResolved }>,
  formData: FormData,
): Promise<ActionResult<{ config: LabCurrencyResolved }>> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });
  if (!hasRole(session.user.roles, LAB_ROLE.ADMIN)) {
    return failure({ formError: "Forbidden." });
  }

  const parsed = labCurrencyConfigFormSchema.safeParse({
    functionalCurrencyCode: formData.get("functionalCurrencyCode"),
    additionalTransactionCodesRaw: formData.get("additionalTransactionCodesRaw") ?? "",
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const { functionalCurrencyCode } = parsed.data;
  const tokens = parseCurrencyCodesList(parsed.data.additionalTransactionCodesRaw);
  const invalid = [...new Set(tokens)].filter((t) => !isValidIso4217Code(t));
  if (invalid.length) {
    return failure({
      formError: `Unknown ISO 4217 codes: ${invalid.join(", ")}`,
    });
  }

  const additionalTransactionCodes = normalizeAdditionalTransactionCodes(
    functionalCurrencyCode,
    tokens,
  );

  await prisma.labCurrencyConfig.upsert({
    where: { id: LAB_CURRENCY_CONFIG_ID },
    create: {
      id: LAB_CURRENCY_CONFIG_ID,
      functionalCurrencyCode,
      additionalTransactionCodes,
    },
    update: {
      functionalCurrencyCode,
      additionalTransactionCodes,
    },
  });

  revalidateLabCurrencyConfigCache();
  revalidatePath("/settings");
  revalidatePath("/settings/currencies");

  const resolved = resolveLabCurrencyConfig({
    functionalCurrencyCode,
    additionalTransactionCodes,
    persisted: true,
  });

  return success({ config: resolved });
}
