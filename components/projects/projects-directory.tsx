"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faChevronRight,
  faDiagramProject,
  faLink,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { ProjectListRowModel } from "@/lib/project/to-project-list-row";

type ProjectsDirectoryProps = {
  projects: ProjectListRowModel[];
  /** When empty: show “create one” vs “contact staff” copy. */
  canCreateProject?: boolean;
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

export function ProjectsDirectory({
  projects,
  canCreateProject = false,
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

  return (
    <ul className="flex flex-col gap-2">
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            href={`/projects/${p.id}`}
            className="group flex gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/25 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${p.name}: ${p.memberCount} members, ${p.assetCount} assigned assets, ${p.linkCount} links`}
          >
            <span className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary">
              <FontAwesomeIcon icon={faDiagramProject} className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-semibold text-primary group-hover:underline">
                  {p.name}
                </span>
                {p.slug ? (
                  <span className="font-mono text-xs text-muted-foreground">{p.slug}</span>
                ) : null}
              </div>
              {p.descriptionPreview ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {p.descriptionPreview}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-0.5">
                <Stat
                  icon={faUsers}
                  value={p.memberCount}
                  singular="member"
                  plural="members"
                />
                <Stat
                  icon={faBox}
                  value={p.assetCount}
                  singular="asset"
                  plural="assets"
                />
                <Stat
                  icon={faLink}
                  value={p.linkCount}
                  singular="link"
                  plural="links"
                />
              </div>
            </div>
            <span className="shrink-0 self-center text-muted-foreground group-hover:text-primary">
              <FontAwesomeIcon icon={faChevronRight} className="size-4" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
