"use client";

import { useActionState, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCirclePlus,
  faFileLines,
  faFloppyDisk,
  faLink,
  faParagraph,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { updateProjectDetailsAction } from "@/lib/actions/project";
import type { ActionResult } from "@/lib/form/action-result";
import type { ProjectUrlEntry } from "@/lib/schemas/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/form/field-error";
import { SubmitButton } from "@/components/form/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Row = ProjectUrlEntry & { key: string };

function newRowKey() {
  return `r-${Math.random().toString(36).slice(2, 11)}`;
}

function toRows(initial: ProjectUrlEntry[]): Row[] {
  if (initial.length === 0) {
    return [{ label: "", url: "", key: newRowKey() }];
  }
  return initial.map((r) => ({ ...r, key: newRowKey() }));
}

function serializeRows(rows: Row[]): string {
  const cleaned = rows
    .map(({ label, url }) => ({ label: label.trim(), url: url.trim() }))
    .filter((r) => r.label.length > 0 && r.url.length > 0);
  return JSON.stringify(cleaned);
}

const initialState: ActionResult<{ saved: true }> = { ok: true };

export type ProjectDetailsFormProps = {
  projectId: string;
  description: string | null;
  webLinks: ProjectUrlEntry[];
  documentLinks: ProjectUrlEntry[];
};

export function ProjectDetailsForm({
  projectId,
  description,
  webLinks,
  documentLinks,
}: ProjectDetailsFormProps) {
  const [state, formAction] = useActionState(
    updateProjectDetailsAction,
    initialState,
  );

  const [webRows, setWebRows] = useState<Row[]>(() => toRows(webLinks));
  const [docRows, setDocRows] = useState<Row[]>(() => toRows(documentLinks));

  useEffect(() => {
    if (state.ok && state.data?.saved) {
      toast.success("Project details saved.");
    }
  }, [state]);

  const addWeb = () =>
    setWebRows((prev) => [...prev, { label: "", url: "", key: newRowKey() }]);
  const addDoc = () =>
    setDocRows((prev) => [...prev, { label: "", url: "", key: newRowKey() }]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-primary">
          <FontAwesomeIcon icon={faParagraph} className="size-5" />
          Project profile
        </CardTitle>
        <CardDescription>
          Description, external links, and document URLs (shared drives, PDFs,
          specs). Inventory can be assigned on each asset.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="webLinksJson" value={serializeRows(webRows)} />
          <input
            type="hidden"
            name="documentLinksJson"
            value={serializeRows(docRows)}
          />

          {!state.ok && state.formError ? (
            <p className="text-sm text-destructive" role="alert">
              {state.formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              name="description"
              rows={5}
              maxLength={20000}
              defaultValue={description ?? ""}
              placeholder="Goals, scope, stakeholders, notes…"
              className="min-h-[120px]"
            />
            <FieldError errors={state.ok ? undefined : state.fieldErrors?.description} />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="inline-flex items-center gap-2 text-base">
                <FontAwesomeIcon
                  icon={faLink}
                  className="size-3.5 text-muted-foreground"
                />
                Web links
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addWeb}>
                <FontAwesomeIcon icon={faCirclePlus} className="size-3.5" />
                Add link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Repositories, wikis, dashboards — must be valid https URLs.
            </p>
            <div className="space-y-2">
              {webRows.map((row, i) => (
                <div
                  key={row.key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-end"
                >
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <Input
                      aria-label={`Web link ${i + 1} label`}
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => {
                        const v = e.target.value;
                        setWebRows((prev) =>
                          prev.map((r) =>
                            r.key === row.key ? { ...r, label: v } : r,
                          ),
                        );
                      }}
                    />
                    <Input
                      aria-label={`Web link ${i + 1} URL`}
                      placeholder="https://…"
                      value={row.url}
                      onChange={(e) => {
                        const v = e.target.value;
                        setWebRows((prev) =>
                          prev.map((r) =>
                            r.key === row.key ? { ...r, url: v } : r,
                          ),
                        );
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove web link row ${i + 1}`}
                    onClick={() =>
                      setWebRows((prev) =>
                        prev.length <= 1
                          ? [{ label: "", url: "", key: newRowKey() }]
                          : prev.filter((r) => r.key !== row.key),
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faTrash} className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="inline-flex items-center gap-2 text-base">
                <FontAwesomeIcon
                  icon={faFileLines}
                  className="size-3.5 text-muted-foreground"
                />
                Documents & files
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addDoc}>
                <FontAwesomeIcon icon={faCirclePlus} className="size-3.5" />
                Add URL
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Point to hosted files (SharePoint, Drive, etc.); uploads are not
              stored in Lab Nexus yet.
            </p>
            <div className="space-y-2">
              {docRows.map((row, i) => (
                <div
                  key={row.key}
                  className="flex flex-col gap-2 sm:flex-row sm:items-end"
                >
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <Input
                      aria-label={`Document ${i + 1} label`}
                      placeholder="Label"
                      value={row.label}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDocRows((prev) =>
                          prev.map((r) =>
                            r.key === row.key ? { ...r, label: v } : r,
                          ),
                        );
                      }}
                    />
                    <Input
                      aria-label={`Document ${i + 1} URL`}
                      placeholder="https://…"
                      value={row.url}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDocRows((prev) =>
                          prev.map((r) =>
                            r.key === row.key ? { ...r, url: v } : r,
                          ),
                        );
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove document row ${i + 1}`}
                    onClick={() =>
                      setDocRows((prev) =>
                        prev.length <= 1
                          ? [{ label: "", url: "", key: newRowKey() }]
                          : prev.filter((r) => r.key !== row.key),
                      )
                    }
                  >
                    <FontAwesomeIcon icon={faTrash} className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <SubmitButton pendingLabel="Saving…">
            <FontAwesomeIcon icon={faFloppyDisk} className="size-4" />
            Save project profile
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
