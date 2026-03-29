"use server";

import { signIn } from "@/auth";
import { failure, zodErrorToFieldErrors, type ActionResult } from "@/lib/form/action-result";
import { loginSchema } from "@/lib/schemas/login";
import { getRequestIp } from "@/lib/request-ip";
import { rateLimit } from "@/lib/rate-limit";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 30;

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ip = await getRequestIp();
  const limited = rateLimit(`login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!limited.ok) {
    return failure({
      formError: "Too many sign-in attempts from this network. Try again later.",
    });
  }

  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    if (result && typeof result === "object" && "error" in result && result.error) {
      return failure({ formError: "Invalid email or password." });
    }
  } catch (e) {
    if (e instanceof AuthError) {
      return failure({ formError: "Invalid email or password." });
    }
    throw e;
  }

  redirect("/");
}
