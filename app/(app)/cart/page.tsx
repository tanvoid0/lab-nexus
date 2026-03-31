import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { CartCheckoutForm } from "@/components/cart/cart-checkout-form";
import { redirect } from "next/navigation";

export default async function CartPage() {
  const session = await auth();
  if (!hasAnyRole(session?.user?.roles, LAB_ROLES)) {
    redirect("/inventory");
  }

  const projects = await prisma.project.findMany({
    where: { ...notDeleted },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Request list</h1>
        <p className="text-sm text-muted-foreground">
          Select equipment, set shared request details, then submit for review or direct issue.
          Purpose and project stay optional for reporting.
        </p>
      </div>
      <CartCheckoutForm projects={projects} />
    </div>
  );
}
