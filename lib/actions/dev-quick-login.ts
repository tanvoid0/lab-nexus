"use server";

import { signIn } from "@/auth";
import { failure, type ActionResult } from "@/lib/form/action-result";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_STAFF_EMAIL,
  DEMO_STUDENT_EMAIL,
  getDemoPasswordPlain,
} from "@/lib/dev/demo-auth";
import { getRequestIp } from "@/lib/request-ip";
import { rateLimit } from "@/lib/rate-limit";
import { AuthError } from "next-auth";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 30;

export type DevQuickLoginPreset = "admin" | "staff" | "student";

export async function devQuickLoginAction(
  preset: DevQuickLoginPreset,
): Promise<ActionResult> {
  if (process.env.NODE_ENV !== "development") {
    return failure({
      formError: "Quick login is only available in development.",
    });
  }

  const ip = await getRequestIp();
  const limited = rateLimit(`login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!limited.ok) {
    return failure({
      formError: "Too many sign-in attempts from this network. Try again later.",
    });
  }

  const email =
    preset === "admin"
      ? DEMO_ADMIN_EMAIL
      : preset === "staff"
        ? DEMO_STAFF_EMAIL
        : DEMO_STUDENT_EMAIL;

  try {
    await signIn("credentials", {
      email,
      password: getDemoPasswordPlain(),
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return failure({
        formError:
          "Quick sign-in failed. Run pnpm db:seed and make sure this database matches the local demo users.",
      });
    }
    throw e;
  }

  return { ok: true };
}
