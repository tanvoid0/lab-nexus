"use client";

import { useActionState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightToBracket,
  faCircleExclamation,
  faFlask,
  faEnvelope,
  faLock,
  faUserGraduate,
  faUserShield,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { loginAction } from "@/lib/actions/login";
import { devQuickLoginAction } from "@/lib/actions/dev-quick-login";
import type { ActionResult } from "@/lib/form/action-result";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitButton } from "@/components/form/submit-button";

const initial: ActionResult = { ok: true };

const isDev = process.env.NODE_ENV === "development";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initial);
  const [_quickLoginState, quickLoginAction, quickLoginPending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
      const preset = formData.get("preset");
      if (preset !== "admin" && preset !== "staff" && preset !== "student") {
        return { ok: false, formError: "Choose a demo account to continue." };
      }
      return devQuickLoginAction(preset);
    },
    initial,
  );
  const quickLoginState = _quickLoginState;

  useEffect(() => {
    if (!state.ok && state.fieldErrors) {
      const keys = Object.keys(state.fieldErrors);
      if (keys.length) {
        const el = document.querySelector<HTMLInputElement>(
          `[name="${keys[0]}"]`,
        );
        el?.focus();
      }
    }
  }, [state]);

  return (
    <Card className="w-full max-w-md border-border shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <FontAwesomeIcon icon={faArrowRightToBracket} className="size-6" />
          Sign in
        </CardTitle>
        <CardDescription>
          Use your email and password. Invalid attempts show below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="space-y-4">
          {!state.ok && state.formError ? (
            <p
              className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{state.formError}</span>
            </p>
          ) : null}
          {isDev && !quickLoginState.ok && quickLoginState.formError ? (
            <p
              className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{quickLoginState.formError}</span>
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="size-3.5 text-muted-foreground"
              />
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={!!(!state.ok && state.fieldErrors?.email)}
            />
            {!state.ok && state.fieldErrors?.email ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faLock}
                className="size-3.5 text-muted-foreground"
              />
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-invalid={!!(!state.ok && state.fieldErrors?.password)}
            />
            {!state.ok && state.fieldErrors?.password ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            ) : null}
          </div>
          <SubmitButton className="w-full" pendingLabel="Signing in…">
            <FontAwesomeIcon icon={faArrowRightToBracket} className="size-4" />
            Sign in
          </SubmitButton>
        </form>
        {isDev ? (
          <div className="border-t border-border pt-4">
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
              <div className="mb-3 flex items-start gap-2">
                <FontAwesomeIcon icon={faFlask} className="mt-0.5 size-4 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Development quick sign-in</p>
                  <p className="text-xs text-muted-foreground">
                    Uses the seeded demo users from{" "}
                    <code className="rounded bg-muted px-1">pnpm db:seed</code>.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <form action={quickLoginAction}>
                  <input type="hidden" name="preset" value="admin" />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={quickLoginPending}
                  >
                    <FontAwesomeIcon icon={faUserShield} className="size-4" />
                    Use admin demo
                  </Button>
                </form>
                <form action={quickLoginAction}>
                  <input type="hidden" name="preset" value="staff" />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={quickLoginPending}
                  >
                    <FontAwesomeIcon icon={faUserTie} className="size-4" />
                    Use staff demo
                  </Button>
                </form>
                <form action={quickLoginAction}>
                  <input type="hidden" name="preset" value="student" />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={quickLoginPending}
                  >
                    <FontAwesomeIcon icon={faUserGraduate} className="size-4" />
                    Use student demo
                  </Button>
                </form>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
