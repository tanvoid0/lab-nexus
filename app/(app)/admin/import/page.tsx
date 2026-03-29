import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { IMPORT_COLUMN_HINTS } from "@/lib/import/import-column-hints";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  const session = await auth();
  if (!hasAnyRole(session?.user?.roles, LAB_ROLES_STAFF)) {
    redirect("/inventory");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-block text-sm text-primary underline-offset-4 hover:underline"
      >
        ← Back to admin
      </Link>
      <div>
        <h1 className="text-2xl font-semibold text-primary">Import spreadsheet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload <strong>.xlsx</strong> or <strong>.csv</strong>. The first worksheet is read. Use{" "}
          <strong>Preview import</strong> for a dry-run (no writes), then <strong>Import</strong> to
          apply. Rows with duplicate SKU (or internal ID) are skipped.
        </p>
      </div>

      <div className="max-w-3xl rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Column mapping (heuristic)</p>
        <p className="mt-1">
          Headers are matched case-sensitively on the key name. The importer uses the{" "}
          <strong>first non-empty</strong> match in each group below.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {IMPORT_COLUMN_HINTS.map((h) => (
            <li key={h.title}>
              <span className="text-foreground">{h.title}:</span>{" "}
              {h.keys.map((k, i) => (
                <span key={k}>
                  {i > 0 ? ", " : null}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">{k}</code>
                </span>
              ))}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs">
          If both <strong>Name</strong> and <strong>SKU</strong> are empty, the row is skipped. Rows
          without a SKU get a generated <code className="rounded bg-muted px-1">IMPORT-…</code> ID.
        </p>
      </div>

      <ImportForm />
    </div>
  );
}
