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

/**
 * When the action failed and there is a form error or field errors map, returns the first
 * message (with optional fallback). Matches typical server-action form UX guards.
 */
export function actionFailureMessage(
  state: ActionResult,
  fallback = "Could not save.",
): string | undefined {
  if (state.ok) return undefined;
  if (!state.formError && !state.fieldErrors) return undefined;
  return state.formError || Object.values(state.fieldErrors ?? {}).flat()[0] || fallback;
}
