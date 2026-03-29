import Link from "next/link";
import { INVENTORY_LIST_PATH } from "@/lib/nav/inventory-paths";

export default function ScanIndexPage() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
      <h1 className="text-lg font-semibold text-primary sm:text-xl">Missing tag</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Add a tag to the URL after <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/scan/</code>
        , or open an item from inventory and use{" "}
        <span className="font-medium text-foreground">Open scan link</span>.
      </p>
      <p className="mt-4">
        <Link
          href={INVENTORY_LIST_PATH}
          className="inline-flex min-h-11 min-w-[min(100%,12rem)] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:min-h-9"
        >
          Back to inventory
        </Link>
      </p>
    </div>
  );
}
