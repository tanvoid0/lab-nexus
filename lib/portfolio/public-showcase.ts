import { prisma } from "@/lib/db";
import { toProjectListRow, type ProjectListRowModel } from "@/lib/project/to-project-list-row";
import { notDeleted } from "@/lib/prisma/active-scopes";

export type PublicAssetShowcaseItem = {
  id: string;
  name: string;
  skuOrInternalId: string;
  categoryName: string | null;
  locationName: string | null;
  projectId: string | null;
  projectName: string | null;
  conditionCode: string;
  operationalStatusCode: string;
  quantityAvailable: number;
  quantityTotal: number;
  imagePath: string | null;
  quoteUrl: string | null;
  notesPreview: string | null;
};

export type PublicPortfolioData = {
  assetCount: number;
  projectCount: number;
  availableAssetCount: number;
  featuredProjects: ProjectListRowModel[];
  featuredAssets: PublicAssetShowcaseItem[];
};

type PublicProjectDetail = ProjectListRowModel & {
  description: string | null;
  webLinks: { label: string; url: string }[];
  documentLinks: { label: string; url: string }[];
  assignedAssets: PublicAssetShowcaseItem[];
};

type PublicAssetDetail = PublicAssetShowcaseItem & {
  acquiredAt: Date | null;
  specs: unknown;
  notes: string | null;
  trackedUnitCount: number;
};

function excerpt(text: string | null, maxLen: number): string | null {
  if (!text?.trim()) return null;
  const compact = text.trim().replace(/\s+/g, " ");
  if (compact.length <= maxLen) return compact;
  return `${compact.slice(0, Math.max(0, maxLen - 1)).trimEnd()}...`;
}

function normalizeLinks(raw: unknown): { label: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Record<string, unknown>;
    const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
    const url = typeof candidate.url === "string" ? candidate.url.trim() : "";
    if (!label || !url || !URL.canParse(url)) return [];
    return [{ label, url }];
  });
}

function toPublicAssetShowcaseItem(asset: {
  id: string;
  name: string;
  skuOrInternalId: string;
  category: { name: string } | null;
  location: { name: string } | null;
  project: { id: string; name: string } | null;
  conditionCode: string;
  operationalStatusCode: string;
  quantityAvailable: number;
  quantityTotal: number;
  imagePath: string | null;
  quoteUrl: string | null;
  notes: string | null;
}): PublicAssetShowcaseItem {
  return {
    id: asset.id,
    name: asset.name,
    skuOrInternalId: asset.skuOrInternalId,
    categoryName: asset.category?.name ?? null,
    locationName: asset.location?.name ?? null,
    projectId: asset.project?.id ?? null,
    projectName: asset.project?.name ?? null,
    conditionCode: asset.conditionCode,
    operationalStatusCode: asset.operationalStatusCode,
    quantityAvailable: asset.quantityAvailable,
    quantityTotal: asset.quantityTotal,
    imagePath: asset.imagePath,
    quoteUrl: asset.quoteUrl,
    notesPreview: excerpt(asset.notes, 180),
  };
}

export async function getPublicPortfolioData(): Promise<PublicPortfolioData> {
  const [projects, assets, projectCount, assetCount, availableAssetCount] = await Promise.all([
    prisma.project.findMany({
      where: { ...notDeleted },
      orderBy: { name: "asc" },
      take: 6,
      include: {
        _count: {
          select: {
            members: true,
            assets: { where: { ...notDeleted } },
          },
        },
      },
    }),
    prisma.asset.findMany({
      where: { ...notDeleted },
      orderBy: [{ quantityAvailable: "desc" }, { updatedAt: "desc" }],
      take: 6,
      include: {
        category: { select: { name: true } },
        location: { select: { name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.project.count({ where: { ...notDeleted } }),
    prisma.asset.count({ where: { ...notDeleted } }),
    prisma.asset.count({
      where: {
        ...notDeleted,
        operationalStatusCode: "AVAILABLE",
        quantityAvailable: { gt: 0 },
      },
    }),
  ]);

  return {
    projectCount,
    assetCount,
    availableAssetCount,
    featuredProjects: projects.map(toProjectListRow),
    featuredAssets: assets.map(toPublicAssetShowcaseItem),
  };
}

export async function getPublicProjectDetail(id: string): Promise<PublicProjectDetail | null> {
  const project = await prisma.project.findFirst({
    where: { id, ...notDeleted },
    include: {
      _count: {
        select: {
          members: true,
          assets: { where: { ...notDeleted } },
        },
      },
      assets: {
        where: { ...notDeleted },
        orderBy: { updatedAt: "desc" },
        take: 8,
        include: {
          category: { select: { name: true } },
          location: { select: { name: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!project) return null;

  return {
    ...toProjectListRow(project),
    description: project.description,
    webLinks: normalizeLinks(project.webLinks),
    documentLinks: normalizeLinks(project.documentLinks),
    assignedAssets: project.assets.map(toPublicAssetShowcaseItem),
  };
}

export async function getPublicAssetDetail(id: string): Promise<PublicAssetDetail | null> {
  const asset = await prisma.asset.findFirst({
    where: { id, ...notDeleted },
    include: {
      category: { select: { name: true } },
      location: { select: { name: true } },
      project: { select: { id: true, name: true } },
      _count: { select: { units: { where: { ...notDeleted } } } },
    },
  });

  if (!asset) return null;

  return {
    ...toPublicAssetShowcaseItem(asset),
    acquiredAt: asset.acquiredAt,
    specs: asset.specs,
    notes: asset.notes,
    trackedUnitCount: asset._count.units,
  };
}
