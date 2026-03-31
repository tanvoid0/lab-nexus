"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faChartSimple,
  faChevronRight,
  faDiagramProject,
  faFlagCheckered,
  faGrip,
  faLink,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { ProjectListRowModel } from "@/lib/project/to-project-list-row";
import { PROJECT_STATUS_ORDER, getProjectStatusMeta } from "@/lib/project/status";

type ProjectsDirectoryProps = {
  projects: ProjectListRowModel[];
  /** When empty: show “create one” vs “contact staff” copy. */
  canCreateProject?: boolean;
  hrefBase?: string;
  view?: "grid" | "board";
};

function Stat({
  icon,
  value,
  singular,
  plural,
}: {
  icon: typeof faUsers;
  value: number;
  singular: string;
  plural: string;
}) {
  const label = value === 1 ? singular : plural;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
      title={`${value} ${label}`}
    >
      <FontAwesomeIcon icon={icon} className="size-3 shrink-0 opacity-80" aria-hidden />
      <span className="tabular-nums">{value}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

function ProjectStatusBadge({ status }: { status: ProjectListRowModel["status"] }) {
  const meta = getProjectStatusMeta(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.badgeClassName}`}
    >
      <FontAwesomeIcon icon={faFlagCheckered} className="size-3" aria-hidden />
      {meta.label}
    </span>
  );
}

function ProjectCard({
  project,
  hrefBase,
}: {
  project: ProjectListRowModel;
  hrefBase: string;
}) {
  return (
    <Link
      href={`${hrefBase}/${project.id}`}
      className="group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${project.name}: ${project.statusLabel}, ${project.memberCount} members, ${project.assetCount} assigned assets, ${project.linkCount} links`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <span className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground group-hover:text-primary">
            <FontAwesomeIcon icon={faDiagramProject} className="size-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-semibold text-primary group-hover:underline">
                {project.name}
              </span>
              {project.slug ? (
                <span className="font-mono text-xs text-muted-foreground">{project.slug}</span>
              ) : null}
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>
        </div>
        <span className="shrink-0 text-muted-foreground group-hover:text-primary">
          <FontAwesomeIcon icon={faChevronRight} className="size-4" aria-hidden />
        </span>
      </div>

      <div className="min-h-10">
        {project.descriptionPreview ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {project.descriptionPreview}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No project summary yet. Open the project to add profile details and links.
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Stat
          icon={faUsers}
          value={project.memberCount}
          singular="member"
          plural="members"
        />
        <Stat
          icon={faBox}
          value={project.assetCount}
          singular="asset"
          plural="assets"
        />
        <Stat
          icon={faLink}
          value={project.linkCount}
          singular="link"
          plural="links"
        />
      </div>
    </Link>
  );
}

export function ProjectsDirectory({
  projects,
  canCreateProject = false,
  hrefBase = "/projects",
  view = "grid",
}: ProjectsDirectoryProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <FontAwesomeIcon
          icon={faDiagramProject}
          className="size-12 text-muted-foreground/50"
          aria-hidden
        />
        <div>
          <p className="font-medium text-foreground">No projects yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {canCreateProject ? (
              <>
                Use{" "}
                <span className="font-medium text-foreground">New project</span> on this page
                to add one and tie checkouts and inventory to a workstream.
              </>
            ) : (
              <>
                Projects will appear here once a researcher or admin creates them.
              </>
            )}
          </p>
        </div>
      </div>
    );
  }

  if (view === "board") {
    return (
      <div className="grid gap-4 xl:grid-cols-4">
        {PROJECT_STATUS_ORDER.map((status) => {
          const meta = getProjectStatusMeta(status);
          const items = projects.filter((project) => project.status === status);
          return (
            <section
              key={status}
              className={`flex min-h-72 flex-col rounded-xl border p-4 ${meta.columnClassName}`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faChartSimple}
                      className="size-4 text-muted-foreground"
                      aria-hidden
                    />
                    <h3 className="font-semibold text-foreground">{meta.label}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
                <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>
              {items.length > 0 ? (
                <div className="grid gap-3">
                  {items.map((project) => (
                    <ProjectCard key={project.id} project={project} hrefBase={hrefBase} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/60 px-4 py-6 text-center text-sm text-muted-foreground">
                  No projects in {meta.label.toLowerCase()} yet.
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FontAwesomeIcon icon={faGrip} className="size-4" aria-hidden />
        Grid view helps compare scope, status, and linked assets at a glance.
      </div>
      <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {projects.map((project) => (
          <li key={project.id} className="h-full">
            <ProjectCard project={project} hrefBase={hrefBase} />
          </li>
        ))}
      </ul>
    </div>
  );
}
