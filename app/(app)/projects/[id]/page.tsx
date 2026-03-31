import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faFlagCheckered,
  faLink as faLinkIcon,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { BreadcrumbDetailFromTitle } from "@/components/layout/breadcrumb-detail-from-title";
import { ProjectMembersPanel } from "@/components/projects/project-members-panel";
import { ProjectDetailsForm } from "@/components/projects/project-details-form";
import { Button } from "@/components/ui/button";
import { normalizeUrlEntries } from "@/lib/project/normalize-url-entries";
import { getProjectStatusMeta } from "@/lib/project/status";
import { toAssetListItem } from "@/lib/mappers/asset";
import { loadLookupLabelMaps } from "@/lib/reference/lookup-label-maps";
import { InventoryAssetTable } from "@/components/inventory/inventory-asset-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectAssignedInventoryTitle } from "@/components/projects/project-assigned-inventory-title";
import type { NextPageProps } from "@/lib/types/next-app";

export default async function ProjectDetailPage({
  params,
}: NextPageProps<{ id: string }>) {
  const { id } = await params;
  const session = await auth();
  const roles = session!.user!.roles ?? [];
  const canManage = hasAnyRole(roles, LAB_ROLES_STAFF);
  const canUseCart = hasAnyRole(roles, LAB_ROLES);

  const [project, assignedAssets, labelMaps] = await Promise.all([
    prisma.project.findFirst({
      where: { id, ...notDeleted },
      include: {
        members: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { email: true, name: true, deletedAt: true } },
          },
        },
      },
    }),
    prisma.asset.findMany({
      where: { projectId: id, ...notDeleted },
      include: {
        category: true,
        location: true,
        project: true,
        _count: { select: { units: { where: { ...notDeleted } } } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    loadLookupLabelMaps(prisma),
  ]);

  if (!project) notFound();

  const webLinks = normalizeUrlEntries(project.webLinks);
  const documentLinks = normalizeUrlEntries(project.documentLinks);
  const assignedRows = await Promise.all(assignedAssets.map((a) => toAssetListItem(a)));
  const conditionLabels = Object.fromEntries(labelMaps.conditionLabelByCode);
  const operationalLabels = Object.fromEntries(
    labelMaps.operationalStatusLabelByCode,
  );
  const statusMeta = getProjectStatusMeta(project.status);

  const hasReadOnlyProfile =
    Boolean(project.description?.trim()) ||
    webLinks.length > 0 ||
    documentLinks.length > 0;

  return (
    <div className="space-y-8">
      <BreadcrumbDetailFromTitle title={project.name} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-2 h-auto px-2 py-1 text-muted-foreground"
          >
            <Link href="/projects">← Projects</Link>
          </Button>
          <h1 className="text-2xl font-semibold text-primary">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusMeta.badgeClassName}`}
            >
              <FontAwesomeIcon icon={faFlagCheckered} className="size-3" />
              {statusMeta.label}
            </span>
            <span className="text-sm text-muted-foreground">{statusMeta.description}</span>
          </div>
          {project.slug ? (
            <p className="font-mono text-sm text-muted-foreground">{project.slug}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <FontAwesomeIcon icon={faUsers} className="size-4" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {project.members.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <FontAwesomeIcon icon={faBox} className="size-4" />
              Assigned assets
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {assignedRows.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-primary">
              <FontAwesomeIcon icon={faLinkIcon} className="size-4" />
              References
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {webLinks.length + documentLinks.length}
          </CardContent>
        </Card>
      </div>

      {canManage ? (
        <ProjectDetailsForm
          projectId={project.id}
          status={project.status}
          description={project.description}
          webLinks={webLinks}
          documentLinks={documentLinks}
        />
      ) : hasReadOnlyProfile ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg text-primary">About this project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {project.description?.trim() ? (
              <p className="whitespace-pre-wrap">{project.description}</p>
            ) : null}
            {webLinks.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium text-foreground">Links</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  {webLinks.map((l) => (
                    <li key={`${l.url}-${l.label}`}>
                      <a
                        href={l.url}
                        className="text-primary underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {documentLinks.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium text-foreground">Documents & files</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  {documentLinks.map((l) => (
                    <li key={`${l.url}-${l.label}-doc`}>
                      <a
                        href={l.url}
                        className="text-primary underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          No project description or links yet.
        </p>
      )}

      <ProjectMembersPanel
        projectId={project.id}
        members={project.members.map((m) => ({
          id: m.id,
          user: m.user,
        }))}
        canManage={canManage}
      />

      <Card className="border-border">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <ProjectAssignedInventoryTitle />
            <CardDescription>
              Assets linked to this project for planning and checkout context.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/inventory?projectId=${encodeURIComponent(project.id)}`}>
              View in inventory
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {assignedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assets assigned yet. Edit an asset and choose this project, or
              filter inventory by project.
            </p>
          ) : (
            <InventoryAssetTable
              rows={assignedRows}
              conditionLabels={conditionLabels}
              operationalLabels={operationalLabels}
              canUseCart={canUseCart}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
