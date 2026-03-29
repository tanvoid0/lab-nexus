import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { AssetForm } from "@/components/inventory/asset-form";

export default async function NewAssetPage() {
  const session = await auth();
  if (!hasAnyRole(session?.user?.roles, ["ADMIN", "RESEARCHER"])) {
    redirect("/inventory");
  }

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
      <AssetForm mode="create" categories={categories} locations={locations} users={users} />
    </div>
  );
}
