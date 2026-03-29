import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function ScanTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);

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
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold text-primary">Unknown tag</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No asset is registered for <code>{decoded}</code>.
        </p>
      </div>
    );
  }

  redirect(`/inventory/${asset.id}`);
}
