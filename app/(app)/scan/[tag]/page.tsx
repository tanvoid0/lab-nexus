import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";
import { prisma } from "@/lib/db";

/** Dynamic segment is usually decoded once by Next.js; re-decoding can throw on tags that contain `%`. */
function scanTagFromParam(tag: string) {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

export default async function ScanTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = scanTagFromParam(tag);

  const unit = await prisma.assetUnit.findFirst({
    where: { trackTag: decoded },
    select: { assetId: true },
  });
  if (unit) {
    redirect(`/inventory/${unit.assetId}`);
  }

  const asset = await prisma.asset.findFirst({
    where: { trackTag: decoded },
    select: { id: true },
  });

  if (!asset) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
        <h1 className="text-lg font-semibold text-primary sm:text-xl">Unknown tag</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          No asset is registered for{" "}
          <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs sm:text-sm">
            {decoded}
          </code>
          .
        </p>
        <p className="mt-4">
          <Link
            href="/inventory"
            className="inline-flex min-h-11 min-w-[min(100%,12rem)] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:min-h-9"
          >
            Back to inventory
          </Link>
        </p>
      </div>
    );
  }

  redirect(`/inventory/${asset.id}`);
}
