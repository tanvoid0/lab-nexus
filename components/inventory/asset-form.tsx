"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBarcode,
  faCamera,
  faCube,
  faDiagramProject,
  faFloppyDisk,
  faLink,
  faNoteSticky,
  faPenToSquare,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import type { Asset, AssetCategory, Location, Project, User } from "@prisma/client";
import { createAssetAction, updateAssetAction } from "@/lib/actions/assets";
import type { ActionResult } from "@/lib/form/action-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/form/field-error";
import { SubmitButton } from "@/components/form/submit-button";
import { mergeLookupOptions } from "@/lib/reference/merge-lookup-options";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AssetImage } from "@/components/inventory/asset-image";
import { nativeSelectClassName } from "@/lib/form/native-field-classes";

const initial: ActionResult = { ok: true };

export type AssetFormProps = {
  mode: "create" | "edit";
  asset?: Asset;
  categories: AssetCategory[];
  locations: Location[];
  projects: Pick<Project, "id" | "name">[];
  users: Pick<User, "id" | "name" | "email">[];
  conditionLookups: { code: string; label: string }[];
  operationalStatusLookups: { code: string; label: string }[];
};

export function AssetForm({
  mode,
  asset,
  categories,
  locations,
  projects,
  users,
  conditionLookups,
  operationalStatusLookups,
}: AssetFormProps) {
  const conditionOptions = mergeLookupOptions(conditionLookups, asset?.conditionCode);
  const operationalOptions = mergeLookupOptions(
    operationalStatusLookups,
    asset?.operationalStatusCode,
  );

  const action = mode === "create" ? createAssetAction : updateAssetAction;
  const [state, formAction] = useActionState(action, initial);

  useEffect(() => {
    if (!state.ok && state.fieldErrors) {
      const keys = Object.keys(state.fieldErrors);
      if (keys.length) {
        document.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus();
      }
    }
  }, [state]);

  return (
    <Card className="max-w-2xl border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <FontAwesomeIcon
            icon={mode === "create" ? faCube : faPenToSquare}
            className="size-6"
          />
          {mode === "create" ? "New asset" : "Edit asset"}
        </CardTitle>
        <CardDescription>
          Fields are validated on the server. Image upload optional (max 5MB).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && asset ? (
            <input type="hidden" name="id" value={asset.id} />
          ) : null}
          {!state.ok && state.formError ? (
            <p
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {state.formError}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="skuOrInternalId" className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faTag} className="size-3.5 text-muted-foreground" />
                SKU / internal ID
              </Label>
              <Input
                id="skuOrInternalId"
                name="skuOrInternalId"
                required
                defaultValue={asset?.skuOrInternalId}
                aria-invalid={!!(!state.ok && state.fieldErrors?.skuOrInternalId)}
              />
              <FieldError errors={state.ok ? undefined : state.fieldErrors?.skuOrInternalId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackTag" className="inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faBarcode} className="size-3.5 text-muted-foreground" />
                Track tag / QR code
              </Label>
              <Input
                id="trackTag"
                name="trackTag"
                defaultValue={asset?.trackTag ?? ""}
                placeholder="Optional unique tag"
              />
              <FieldError errors={state.ok ? undefined : state.fieldErrors?.trackTag} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={asset?.name}
              aria-invalid={!!(!state.ok && state.fieldErrors?.name)}
            />
            <FieldError errors={state.ok ? undefined : state.fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specs">Specifications (JSON or free text)</Label>
            <Textarea
              id="specs"
              name="specs"
              rows={3}
              defaultValue={
                asset?.specs
                  ? typeof asset.specs === "object"
                    ? JSON.stringify(asset.specs, null, 2)
                    : String(asset.specs)
                  : ""
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="conditionCode">Condition</Label>
              <select
                id="conditionCode"
                name="conditionCode"
                className={nativeSelectClassName()}
                defaultValue={asset?.conditionCode ?? "UNKNOWN"}
              >
                {conditionOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <FieldError errors={state.ok ? undefined : state.fieldErrors?.conditionCode} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operationalStatusCode">Operational status</Label>
              <select
                id="operationalStatusCode"
                name="operationalStatusCode"
                className={nativeSelectClassName()}
                defaultValue={asset?.operationalStatusCode ?? "AVAILABLE"}
              >
                {operationalOptions.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
              <FieldError
                errors={state.ok ? undefined : state.fieldErrors?.operationalStatusCode}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantityTotal">Total quantity</Label>
              <Input
                id="quantityTotal"
                name="quantityTotal"
                type="number"
                min={1}
                required
                defaultValue={asset?.quantityTotal ?? 1}
              />
              <FieldError errors={state.ok ? undefined : state.fieldErrors?.quantityTotal} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantityAvailable">Available quantity</Label>
              <Input
                id="quantityAvailable"
                name="quantityAvailable"
                type="number"
                min={0}
                defaultValue={asset?.quantityAvailable ?? ""}
                placeholder="Defaults to total"
              />
              <FieldError
                errors={state.ok ? undefined : state.fieldErrors?.quantityAvailable}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                className={nativeSelectClassName()}
                defaultValue={asset?.categoryId ?? ""}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId">Location</Label>
              <select
                id="locationId"
                name="locationId"
                className={nativeSelectClassName()}
                defaultValue={asset?.locationId ?? ""}
              >
                <option value="">—</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId" className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faDiagramProject}
                className="size-3.5 text-muted-foreground"
              />
              Project (allocation)
            </Label>
            <select
              id="projectId"
              name="projectId"
              className={nativeSelectClassName()}
              defaultValue={asset?.projectId ?? ""}
              aria-invalid={!!(!state.ok && state.fieldErrors?.projectId)}
            >
              <option value="">— None —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <FieldError errors={state.ok ? undefined : state.fieldErrors?.projectId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custodianUserId">Custodian</Label>
            <select
              id="custodianUserId"
              name="custodianUserId"
              className={nativeSelectClassName()}
              defaultValue={asset?.custodianUserId ?? ""}
            >
              <option value="">—</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acquiredAt">Acquired date</Label>
            <Input
              id="acquiredAt"
              name="acquiredAt"
              type="date"
              defaultValue={
                asset?.acquiredAt
                  ? asset.acquiredAt.toISOString().slice(0, 10)
                  : ""
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quoteUrl" className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faLink} className="size-3.5 text-muted-foreground" />
              Quote / documentation URL
            </Label>
            <Input
              id="quoteUrl"
              name="quoteUrl"
              type="url"
              defaultValue={asset?.quoteUrl ?? ""}
              placeholder="https://"
            />
            <FieldError errors={state.ok ? undefined : state.fieldErrors?.quoteUrl} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faNoteSticky} className="size-3.5 text-muted-foreground" />
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={asset?.notes ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faCamera} className="size-3.5 text-muted-foreground" />
              Photo
            </Label>
            {asset?.imagePath ? (
              <div className="space-y-2">
                <AssetImage
                  src={asset.imagePath}
                  alt={`Current photo of ${asset.name}`}
                  sizes="(max-width: 768px) 100vw, 320px"
                  className="aspect-video max-w-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Current image shown above. Upload a new file to replace it.
                </p>
              </div>
            ) : null}
            <Input id="image" name="image" type="file" accept="image/*" />
            <FieldError errors={state.ok ? undefined : state.fieldErrors?.image} />
          </div>

          <div className="flex gap-2">
            <SubmitButton pendingLabel="Saving…">
              <FontAwesomeIcon icon={faFloppyDisk} className="size-4" />
              {mode === "create" ? "Create asset" : "Save changes"}
            </SubmitButton>
            <Button type="button" variant="outline" asChild>
              <Link
                href={asset ? `/inventory/${asset.id}` : "/inventory"}
                className="gap-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="size-4" />
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
