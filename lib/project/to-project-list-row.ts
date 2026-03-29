import type { Project } from "@prisma/client";
import { normalizeUrlEntries } from "@/lib/project/normalize-url-entries";

export type ProjectListRowModel = {
  id: string;
  name: string;
  slug: string | null;
  descriptionPreview: string | null;
  memberCount: number;
  assetCount: number;
  linkCount: number;
};

type ProjectWithCounts = Pick<
  Project,
  "id" | "name" | "slug" | "description" | "webLinks" | "documentLinks"
> & {
  _count: { members: number; assets: number };
};

function excerpt(text: string | null, maxLen: number): string | null {
  if (!text?.trim()) return null;
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

export function toProjectListRow(p: ProjectWithCounts): ProjectListRowModel {
  const web = normalizeUrlEntries(p.webLinks);
  const docs = normalizeUrlEntries(p.documentLinks);
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    descriptionPreview: excerpt(p.description, 160),
    memberCount: p._count.members,
    assetCount: p._count.assets,
    linkCount: web.length + docs.length,
  };
}
