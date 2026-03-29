import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ProjectsPage() {
  const session = await auth();
  const roles = session!.user!.roles ?? [];
  const canManage = hasAnyRole(roles, ["ADMIN", "RESEARCHER"]);

  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Tie checkouts to a lab project. Anyone signed in can view the list;
          researchers and admins can create projects and manage members.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-primary">All projects</CardTitle>
              <CardDescription>Open a project to manage its members.</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/60"
                      >
                        <span className="font-medium text-primary">{p.name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {p._count.members} member
                          {p._count.members === 1 ? "" : "s"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {canManage ? (
          <div className="lg:col-span-1">
            <CreateProjectForm />
          </div>
        ) : null}
      </div>
    </div>
  );
}
