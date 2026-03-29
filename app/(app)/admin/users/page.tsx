import Link from "next/link";
import { auth } from "@/auth";
import { hasRole, LAB_ROLE } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  deactivateLabUserAction,
  restoreLabUserAction,
} from "@/lib/actions/user-lifecycle";
import { accountDisplayLabel } from "@/lib/checkout/borrower-display";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const session = await auth();
  if (!hasRole(session?.user?.roles ?? [], LAB_ROLE.ADMIN)) {
    redirect("/inventory");
  }

  const sp = await searchParams;
  const err = sp.err;

  const users = await prisma.user.findMany({
    orderBy: { email: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      roles: true,
      deletedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 h-auto px-2 py-1 text-muted-foreground"
          >
            <Link href="/admin">← Admin</Link>
          </Button>
          <h1 className="text-2xl font-semibold text-primary">Lab accounts</h1>
          <p className="text-sm text-muted-foreground">
            Deactivate accounts instead of deleting them so checkouts and audit history stay
            consistent. Deactivated users cannot sign in.
          </p>
        </div>
      </div>

      {err === "self" ? (
        <p className="text-sm text-destructive" role="alert">
          You cannot deactivate your own account from here.
        </p>
      ) : null}
      {err === "missing" || err === "invalid" ? (
        <p className="text-sm text-destructive" role="alert">
          That request was invalid or the account state changed. Try again.
        </p>
      ) : null}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-primary">All users</CardTitle>
          <CardDescription>
            {users.length} record{users.length === 1 ? "" : "s"} in the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users.</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {accountDisplayLabel(u)}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">{u.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Roles: {u.roles.join(", ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {u.deletedAt ? (
                      <form action={restoreLabUserAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <Button type="submit" size="sm" variant="secondary">
                          Restore
                        </Button>
                      </form>
                    ) : (
                      <form action={deactivateLabUserAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={u.id === session!.user!.id}
                        >
                          Deactivate
                        </Button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
