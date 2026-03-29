"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faCalendarDays,
  faCartShopping,
  faClipboardCheck,
  faFolderOpen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { submitCartCheckoutAction } from "@/lib/actions/checkout-request";
import type { ActionResult } from "@/lib/form/action-result";
import { useCart } from "@/components/providers/cart-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/form/field-error";
import { nativeSelectClassName } from "@/lib/form/native-field-classes";

const initial: ActionResult<{ requestId: string }> = { ok: true };

export function CartCheckoutForm({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { lines, defaultProjectId, setDefaultProject, setLineProject, removeLine, clearCart } =
    useCart();
  const [state, formAction] = useActionState(submitCartCheckoutAction, initial);
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!state.ok || !state.data?.requestId) return;
    if (handledId.current === state.data.requestId) return;
    handledId.current = state.data.requestId;
    clearCart();
    router.push(`/requests/${state.data.requestId}`);
  }, [state, clearCart, router]);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  const defaultDue = tomorrow.toISOString().slice(0, 16);

  if (lines.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-primary">Your cart is empty</CardTitle>
          <CardDescription>
            Add available items from{" "}
            <Link href="/inventory" className="text-primary underline-offset-4 hover:underline">
              inventory
            </Link>{" "}
            or filter inventory by project if you use projects.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const linesJson = JSON.stringify(
    lines.map((l) => ({
      assetId: l.assetId,
      assetUnitId: l.assetUnitId,
      projectId: l.projectId,
    })),
  );

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <FontAwesomeIcon icon={faCartShopping} className="size-5" />
            Cart ({lines.length})
          </CardTitle>
          <CardDescription>Remove anything you do not want before submitting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((l) => (
            <div
              key={`${l.assetId}:${l.assetUnitId ?? ""}`}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium text-foreground">{l.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{l.skuOrInternalId}</p>
                {l.assetUnitId ? (
                  <p className="text-xs text-muted-foreground">Unit selected on asset page.</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label={`Remove ${l.name} from cart`}
                onClick={() => removeLine(l.assetId, l.assetUnitId)}
              >
                <FontAwesomeIcon icon={faTrash} className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Checkout</CardTitle>
          <CardDescription>
            Researchers and admins are assigned equipment immediately. Students submit a request for
            staff approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="lines" value={linesJson} />
            {!state.ok && state.formError ? (
              <p className="text-sm text-destructive" role="alert">
                {state.formError}
              </p>
            ) : null}
            <FieldError errors={state.ok ? undefined : state.fieldErrors?._form} />
            <details className="rounded-lg border border-border bg-muted/20 p-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                Optional: link to a lab project
              </summary>
              <p className="mt-2 text-xs text-muted-foreground">
                Leave everything here unset if you are not allocating this loan to a project. When set, it is stored on the checkout for filtering and exports.
              </p>
              <div className="mt-3 space-y-2">
                <Label htmlFor="defaultProjectId" className="inline-flex items-center gap-2 text-xs">
                  <FontAwesomeIcon
                    icon={faFolderOpen}
                    className="size-3.5 text-muted-foreground"
                  />
                  Default for all lines
                </Label>
                <select
                  id="defaultProjectId"
                  name="defaultProjectId"
                  value={defaultProjectId ?? ""}
                  onChange={(e) => setDefaultProject(e.target.value || undefined)}
                  className={nativeSelectClassName()}
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {projects.length > 0 ? (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground">Override per line</p>
                  {lines.map((l) => (
                    <div
                      key={`${l.assetId}:${l.assetUnitId ?? ""}`}
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {l.name}
                      </span>
                      <select
                        value={l.projectId ?? ""}
                        onChange={(e) =>
                          setLineProject(l.assetId, l.assetUnitId, e.target.value || undefined)
                        }
                        aria-label={`Project for ${l.name}`}
                        className={nativeSelectClassName("sm:max-w-xs")}
                      >
                        <option value="">Use default / none</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              ) : null}
            </details>
            <div className="space-y-2">
              <Label htmlFor="purpose" className="inline-flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faAlignLeft}
                  className="size-3.5 text-muted-foreground"
                />
                Purpose (all lines, optional)
              </Label>
              <Textarea id="purpose" name="purpose" rows={3} />
              <FieldError errors={state.ok ? undefined : state.fieldErrors?.purpose} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueAt" className="inline-flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  className="size-3.5 text-muted-foreground"
                />
                Due (all lines)
              </Label>
              <Input
                id="dueAt"
                name="dueAt"
                type="datetime-local"
                required
                defaultValue={defaultDue}
              />
              <FieldError errors={state.ok ? undefined : state.fieldErrors?.dueAt} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditionNote" className="inline-flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faClipboardCheck}
                  className="size-3.5 text-muted-foreground"
                />
                Condition at checkout (optional)
              </Label>
              <Textarea id="conditionNote" name="conditionNote" rows={2} />
            </div>
            <SubmitButton pendingLabel="Submitting…" className="gap-2">
              <FontAwesomeIcon icon={faCartShopping} className="size-4" />
              Submit loan request
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
