import { ZodError } from "zod";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | {
      ok: false;
      fieldErrors?: Record<string, string[]>;
      formError?: string;
    };

export function success<T>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function failure(
  opts: { fieldErrors?: Record<string, string[]>; formError?: string },
): ActionResult<never> {
  return { ok: false, ...opts };
}

export function zodErrorToFieldErrors(err: ZodError): Record<string, string[]> {
  const flat = err.flatten();
  const out: Record<string, string[]> = { ...(flat.fieldErrors as Record<string, string[]>) };
  if (flat.formErrors.length) {
    out._form = flat.formErrors;
  }
  return out;
}
