import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faDiagramProject,
  faGrip,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import { auth } from "@/auth";
import { ProjectStatus } from "@prisma/client";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { ProjectsDirectory } from "@/components/projects/projects-directory";
import { toProjectListRow } from "@/lib/project/to-project-list-row";
import { PROJECT_STATUS_ORDER, getProjectStatusMeta } from "@/lib/project/status";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NextPageProps } from "@/lib/types/next-app";

type ProjectsPageSearchParams = Promise<{
  view?: string | string[];
}>;

function getRequestedView(value: string | string[] | undefined): "grid" | "board" {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "board" ? "board" : "grid";
}

export default async function ProjectsPage({
  searchParams,
}: NextPageProps & { searchParams: ProjectsPageSearchParams }) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;
  const roles = session!.user!.roles ?? [];
  const canManage = hasAnyRole(roles, LAB_ROLES_STAFF);
  const view = getRequestedView(resolvedSearchParams.view);

  const projects = await prisma.project.findMany({
    where: { ...notDeleted },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }, { name: "asc" }],
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
  const statusCounts = Object.fromEntries(
    PROJECT_STATUS_ORDER.map((status) => [
      status,
      rows.filter((row) => row.status === status).length,
    ]),
  ) as Record<ProjectStatus, number>;
  const activeCount = rows.filter((row) => row.status === ProjectStatus.IN_PROGRESS).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Projects</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Each project can hold a profile (description, document and web links),
            team members, and assigned inventory. Checkouts can still be tied to a
            project at loan time. Use statuses to monitor delivery and switch between
            a comparison grid or a Jira-style board.
          </p>
        </div>
        {canManage ? (
          <Button variant="outline" size="sm" asChild className="shrink-0 self-start">
            <Link href="/inventory">Browse inventory</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="border-primary/15 bg-primary/[0.04] xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary">
              <FontAwesomeIcon icon={faDiagramProject} className="size-4" />
              Portfolio overview
            </CardTitle>
            <CardDescription>
              Track what is queued, actively moving, paused, or complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-semibold tabular-nums text-primary">{rows.length}</p>
              <p className="text-sm text-muted-foreground">Total projects</p>
            </div>
            <div>
              <p className="text-3xl font-semibold tabular-nums text-primary">{activeCount}</p>
              <p className="text-sm text-muted-foreground">Currently active</p>
            </div>
            <div>
              <p className="text-3xl font-semibold tabular-nums text-primary">
                {statusCounts[ProjectStatus.DONE]}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        {PROJECT_STATUS_ORDER.map((status) => {
          const meta = getProjectStatusMeta(status);
          return (
            <Card key={status}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary">{meta.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold tabular-nums">{statusCounts[status]}</p>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="text-primary">
                    Project workspace
                    {projects.length > 0 ? (
                      <span className="ml-2 font-normal text-muted-foreground">
                        ({projects.length})
                      </span>
                    ) : null}
                  </CardTitle>
                  <CardDescription>
                    Grid view makes comparison easy; board view groups work by status.
                  </CardDescription>
                </div>
                <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
                  <Button
                    asChild
                    size="sm"
                    variant={view === "grid" ? "default" : "ghost"}
                    className="h-8"
                  >
                    <Link href="/projects">
                      <FontAwesomeIcon icon={faGrip} className="size-3.5" />
                      Grid
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant={view === "board" ? "default" : "ghost"}
                    className="h-8"
                  >
                    <Link href="/projects?view=board">
                      <FontAwesomeIcon icon={faChartSimple} className="size-3.5" />
                      Board
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ProjectsDirectory
                projects={rows}
                canCreateProject={canManage}
                view={view}
              />
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-primary">
                <FontAwesomeIcon icon={faListCheck} className="size-4" />
                Suggested status workflow
              </CardTitle>
              <CardDescription>
                Keep statuses lightweight so the board stays trustworthy.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {PROJECT_STATUS_ORDER.map((status) => {
                const meta = getProjectStatusMeta(status);
                return (
                  <div key={status} className="rounded-lg border border-border bg-background p-3">
                    <p className="font-medium text-foreground">{meta.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
                  </div>
                );
              })}
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
