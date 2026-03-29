"use client";

import { useActionState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiagramProject, faLink, faSignature } from "@fortawesome/free-solid-svg-icons";
import { createProjectAction } from "@/lib/actions/project";
import type { ActionResult } from "@/lib/form/action-result";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/form/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: ActionResult = { ok: true };

export function CreateProjectForm() {
  const [state, formAction] = useActionState(createProjectAction, initial);

  useEffect(() => {
    if (!state.ok && state.fieldErrors) {
      const k = Object.keys(state.fieldErrors)[0];
      if (k) document.querySelector<HTMLElement>(`[name="${k}"]`)?.focus();
    }
  }, [state]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <FontAwesomeIcon icon={faDiagramProject} className="size-5" />
          New project
        </CardTitle>
        <CardDescription>
          Projects group checkouts and can own a profile (description, links).
          Assign assets to a project from each inventory item. Slug is optional
          (generated from the name).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          {!state.ok && state.formError ? (
            <p className="text-sm text-destructive" role="alert">
              {state.formError}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="proj-name" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faSignature}
                className="size-3.5 text-muted-foreground"
              />
              Name
            </Label>
            <Input id="proj-name" name="name" required maxLength={200} />
            {fieldErr(state, "name")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="proj-slug" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faLink}
                className="size-3.5 text-muted-foreground"
              />
              Slug (optional)
            </Label>
            <Input id="proj-slug" name="slug" maxLength={120} placeholder="e.g. winter-field-test" />
            {fieldErr(state, "slug")}
          </div>
          <SubmitButton pendingLabel="Creating…">
            <FontAwesomeIcon icon={faDiagramProject} className="size-4" />
            Create project
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

function fieldErr(state: ActionResult, key: string) {
  if (state.ok || !state.fieldErrors?.[key]) return null;
  return <p className="text-sm text-destructive">{state.fieldErrors[key][0]}</p>;
}
