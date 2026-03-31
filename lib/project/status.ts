import { ProjectStatus } from "@prisma/client";

export type ProjectStatusMeta = {
  label: string;
  description: string;
  badgeClassName: string;
  columnClassName: string;
};

export const PROJECT_STATUS_ORDER = [
  ProjectStatus.PLANNED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.ON_HOLD,
  ProjectStatus.DONE,
] as const;

export const PROJECT_STATUS_META: Record<ProjectStatus, ProjectStatusMeta> = {
  [ProjectStatus.PLANNED]: {
    label: "Planned",
    description: "Scoped work that has not started yet.",
    badgeClassName: "border-slate-300 bg-slate-100 text-slate-700",
    columnClassName: "border-slate-200/80 bg-slate-50/60",
  },
  [ProjectStatus.IN_PROGRESS]: {
    label: "In progress",
    description: "Active work currently moving forward.",
    badgeClassName: "border-sky-300 bg-sky-100 text-sky-700",
    columnClassName: "border-sky-200/80 bg-sky-50/70",
  },
  [ProjectStatus.ON_HOLD]: {
    label: "On hold",
    description: "Paused while waiting on people, parts, or decisions.",
    badgeClassName: "border-amber-300 bg-amber-100 text-amber-700",
    columnClassName: "border-amber-200/80 bg-amber-50/70",
  },
  [ProjectStatus.DONE]: {
    label: "Done",
    description: "Completed work kept for reference and reporting.",
    badgeClassName: "border-emerald-300 bg-emerald-100 text-emerald-700",
    columnClassName: "border-emerald-200/80 bg-emerald-50/70",
  },
};

export function getProjectStatusMeta(status: ProjectStatus): ProjectStatusMeta {
  return PROJECT_STATUS_META[status];
}
