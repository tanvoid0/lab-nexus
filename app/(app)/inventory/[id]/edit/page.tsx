import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { AssetForm } from "@/components/inventory/asset-form";

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!hasAnyRole(session?.user?.roles, ["ADMIN", "RESEARCHER"])) {
    redirect("/inventory");
  }
  const { id } = await params;
  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) notFound();

  const [categories, locations, users] = await Promise.all([
    prisma.assetCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { email: "asc" },
    }),
  ]);

  return (
    <div>
      <AssetForm
        mode="edit"
        asset={asset}
        categories={categories}
        locations={locations}
        users={users}
      />
    </div>
  );
}
