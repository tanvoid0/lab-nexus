"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightToBracket,
  faCircleExclamation,
  faEnvelope,
  faLock,
  faUserShield,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import { loginAction } from "@/lib/actions/login";
import {
  devQuickLoginAction,
  type DevQuickLoginPreset,
} from "@/lib/actions/dev-quick-login";
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
  const formRef = useRef<HTMLFormElement>(null);
  const [devError, setDevError] = useState<string | null>(null);
  const [devPending, startDevTransition] = useTransition();

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

  function quickLogin(preset: DevQuickLoginPreset) {
    setDevError(null);
    startDevTransition(async () => {
      const result = await devQuickLoginAction(preset);
      if (!result.ok && result.formError) {
        setDevError(result.formError);
      }
    });
  }

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
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
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
          {isDev && devError ? (
            <p
              className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>{devError}</span>
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
          {isDev ? (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-center text-xs text-muted-foreground">
                Development quick sign-in (same users as{" "}
                <code className="rounded bg-muted px-1">pnpm db:seed</code>)
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={devPending}
                  onClick={() => quickLogin("admin")}
                >
                  <FontAwesomeIcon icon={faUserShield} className="size-4" />
                  Login as admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={devPending}
                  onClick={() => quickLogin("staff")}
                >
                  <FontAwesomeIcon icon={faUserTie} className="size-4" />
                  Login as staff
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
