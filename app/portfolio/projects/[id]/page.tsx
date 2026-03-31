import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlagCheckered } from "@fortawesome/free-solid-svg-icons";
import { notFound } from "next/navigation";
import { PublicInventoryGrid } from "@/components/public/public-inventory-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getPublicProjectDetail } from "@/lib/portfolio/public-showcase";
import { getProjectStatusMeta } from "@/lib/project/status";
import { loadLookupLabelMaps } from "@/lib/reference/lookup-label-maps";
import type { NextPageProps } from "@/lib/types/next-app";

export default async function PublicProjectDetailPage({
  params,
}: NextPageProps<{ id: string }>) {
  const { id } = await params;
  const [project, labelMaps] = await Promise.all([
    getPublicProjectDetail(id),
    loadLookupLabelMaps(prisma),
  ]);

  if (!project) notFound();

  const conditionLabels = Object.fromEntries(labelMaps.conditionLabelByCode);
  const operationalLabels = Object.fromEntries(labelMaps.operationalStatusLabelByCode);
  const statusMeta = getProjectStatusMeta(project.status);

  return (
    <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 2xl:max-w-[112rem]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 h-auto px-2 py-1">
            <Link href="/#projects">Back to portfolio</Link>
          </Button>
          <h1 className="text-3xl font-semibold text-primary">{project.name}</h1>
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
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/login">Sign in to work with this project</Link>
          </Button>
        </div>
      </div>

      <Card className="border-primary/15 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-primary">Project showcase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This public page highlights the project overview, linked references, and the equipment
          associated with the work without exposing management-only controls.
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Members</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {project.memberCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Assigned assets</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {project.assetCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-primary">Links</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold tabular-nums">
            {project.linkCount}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">About this project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {project.description?.trim() ? (
            <p className="whitespace-pre-wrap">{project.description}</p>
          ) : (
            <p className="text-muted-foreground">No public description is available yet.</p>
          )}
          {project.webLinks.length > 0 ? (
            <div className="space-y-2">
              <p className="font-medium text-foreground">Links</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                {project.webLinks.map((link) => (
                  <li key={`${link.label}-${link.url}`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {project.documentLinks.length > 0 ? (
            <div className="space-y-2">
              <p className="font-medium text-foreground">Documents</p>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                {project.documentLinks.map((link) => (
                  <li key={`${link.label}-${link.url}-doc`}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Assigned equipment</h2>
            <p className="text-sm text-muted-foreground">
              Public read-only view of items linked to this project.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in to browse the full inventory</Link>
          </Button>
        </div>
        <PublicInventoryGrid
          assets={project.assignedAssets}
          conditionLabels={conditionLabels}
          operationalLabels={operationalLabels}
        />
      </section>
    </div>
  );
}
