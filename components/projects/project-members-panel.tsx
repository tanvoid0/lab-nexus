"use client";

import { useActionState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faUserMinus,
  faUserPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  addProjectMemberAction,
  removeProjectMemberAction,
} from "@/lib/actions/project";
import { accountDisplayLabel } from "@/lib/checkout/borrower-display";
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
import { Button } from "@/components/ui/button";

const initial: ActionResult = { ok: true };

export type ProjectMemberRow = {
  id: string;
  user: { email: string; name: string | null; deletedAt: Date | null };
};

export function ProjectMembersPanel({
  projectId,
  members,
  canManage,
}: {
  projectId: string;
  members: ProjectMemberRow[];
  canManage: boolean;
}) {
  const [addState, addAction] = useActionState(addProjectMemberAction, initial);

  useEffect(() => {
    if (!addState.ok && addState.fieldErrors) {
      const k = Object.keys(addState.fieldErrors)[0];
      if (k) document.querySelector<HTMLElement>(`[name="${k}"]`)?.focus();
    }
  }, [addState]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <FontAwesomeIcon icon={faUsers} className="size-5" />
          Members
        </CardTitle>
        <CardDescription>
          Lab accounts on this project (must already exist in Lab Nexus).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{accountDisplayLabel(m.user)}</p>
                  <p className="text-muted-foreground">{m.user.email}</p>
                </div>
                {canManage ? (
                  <RemoveMemberForm projectId={projectId} memberId={m.id} />
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canManage ? (
          <div className="border-t border-border pt-4">
            <form action={addAction} className="space-y-3">
              <input type="hidden" name="projectId" value={projectId} />
              {!addState.ok && addState.formError ? (
                <p className="text-sm text-destructive" role="alert">
                  {addState.formError}
                </p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="member-email" className="inline-flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="size-3.5 text-muted-foreground"
                  />
                  Add by email
                </Label>
                <Input
                  id="member-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="colleague@university.edu"
                />
                {fieldErr(addState, "email")}
              </div>
              <SubmitButton pendingLabel="Adding…">
                <FontAwesomeIcon icon={faUserPlus} className="size-4" />
                Add member
              </SubmitButton>
            </form>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RemoveMemberForm({
  projectId,
  memberId,
}: {
  projectId: string;
  memberId: string;
}) {
  const [state, formAction] = useActionState(removeProjectMemberAction, initial);
  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="memberId" value={memberId} />
      {!state.ok && state.formError ? (
        <p className="mb-2 text-xs text-destructive">{state.formError}</p>
      ) : null}
      <Button type="submit" variant="outline" size="sm" className="gap-1.5">
        <FontAwesomeIcon icon={faUserMinus} className="size-3.5" />
        Remove
      </Button>
    </form>
  );
}

function fieldErr(state: ActionResult, key: string) {
  if (state.ok || !state.fieldErrors?.[key]) return null;
  return <p className="text-sm text-destructive">{state.fieldErrors[key][0]}</p>;
}
