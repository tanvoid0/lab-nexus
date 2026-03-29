import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { ImportForm } from "./import-form";

export default async function ImportPage() {
  const session = await auth();
  if (!hasAnyRole(session?.user?.roles, ["ADMIN", "RESEARCHER"])) {
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
          Upload <strong>.xlsx</strong> or <strong>.csv</strong>. Columns are matched loosely
          (Category, Name, Number, Notes, Quote). Rows with duplicate SKU are skipped.
        </p>
      </div>
      <ImportForm />
    </div>
  );
}
