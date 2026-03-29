import Link from "next/link";
import { auth } from "@/auth";
import { hasRole, LAB_ROLE } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { LabCurrencyForm } from "@/components/settings/lab-currency-form";
import { Button } from "@/components/ui/button";
import { getCachedLabCurrencyConfig, getIso4217Codes } from "@/lib/currency";

export default async function SettingsCurrenciesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!hasRole(session.user.roles ?? [], LAB_ROLE.ADMIN)) {
    redirect("/settings");
  }

  const [resolved, codes] = await Promise.all([
    getCachedLabCurrencyConfig(),
    Promise.resolve(getIso4217Codes()),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1 h-auto px-2 py-1 text-muted-foreground">
          <Link href="/settings">← Settings</Link>
        </Button>
        <h1 className="text-2xl font-semibold text-primary">Lab currencies</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lab-wide currency policy for future procurement and financial fields. Matches common ERP
          practice: one <strong className="font-medium text-foreground">functional</strong> currency
          for reporting, plus explicit{" "}
          <strong className="font-medium text-foreground">transaction</strong> currencies for vendor
          charges.
        </p>
        {!resolved.persisted ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-500">
            No saved configuration yet—defaults use{" "}
            <code className="rounded bg-muted px-1">{resolved.functionalCurrencyCode}</code> from the
            database bootstrap (see <code className="rounded bg-muted px-1">LAB_FUNCTIONAL_CURRENCY</code>{" "}
            in <code className="rounded bg-muted px-1">.env.example</code>). Save once to persist.
          </p>
        ) : null}
      </div>

      <LabCurrencyForm initialResolved={resolved} iso4217Codes={codes} />
    </div>
  );
}
