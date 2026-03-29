import Link from "next/link";
import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { ProjectsDirectory } from "@/components/projects/projects-directory";
import { toProjectListRow } from "@/lib/project/to-project-list-row";
import { Button } from "@/components/ui/button";
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
  const canManage = hasAnyRole(roles, LAB_ROLES_STAFF);

  const projects = await prisma.project.findMany({
    where: { ...notDeleted },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          members: true,
          assets: { where: { ...notDeleted } },
        },
      },
    },
  });

  const rows = projects.map(toProjectListRow);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Projects</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Each project can hold a profile (description, document and web links),
            team members, and assigned inventory. Checkouts can still be tied to a
            project at loan time.
          </p>
        </div>
        {canManage ? (
          <Button variant="outline" size="sm" asChild className="shrink-0 self-start">
            <Link href="/inventory">Browse inventory</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary">
                All projects
                {projects.length > 0 ? (
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({projects.length})
                  </span>
                ) : null}
              </CardTitle>
              <CardDescription>
                Open a project for its profile, members, and assigned assets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectsDirectory projects={rows} canCreateProject={canManage} />
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
