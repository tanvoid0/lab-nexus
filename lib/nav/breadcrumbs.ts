export type BreadcrumbItem = {
  href: string;
  label: string;
};

const STATIC_LABELS: Record<string, string> = {
  inventory: "Inventory",
  checkouts: "Checkouts",
  projects: "Projects",
  notifications: "Notifications",
  admin: "Admin",
  settings: "Settings",
  scan: "Scan",
  new: "New",
  edit: "Edit",
  import: "Import",
  audit: "Audit",
  analytics: "Analytics",
  "reference-data": "Reference data",
  currencies: "Lab currencies",
  cart: "Cart",
  requests: "Loan requests",
  "checkout-requests": "Loan approvals",
};

function humanizeSegment(segment: string): string {
  try {
    const decoded = decodeURIComponent(segment);
    return decoded
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  } catch {
    return segment;
  }
}

function isMongoObjectId(segment: string): boolean {
  return /^[a-f0-9]{24}$/i.test(segment);
}

function resolveLabel(
  segment: string,
  parent: string | null,
): string {
  const mapped = STATIC_LABELS[segment];
  if (mapped) return mapped;

  if (parent === "inventory" && isMongoObjectId(segment)) {
    return "Asset";
  }
  if (parent === "projects" && isMongoObjectId(segment)) {
    return "Project";
  }
  if (parent === "requests" && isMongoObjectId(segment)) {
    return "Request";
  }
  if (parent === "scan") {
    const raw = decodeURIComponent(segment);
    return raw.length > 28 ? `${raw.slice(0, 25)}…` : raw;
  }

  return humanizeSegment(segment);
}

/**
 * Build cumulative trail from URL segments under the app layout (same labels/hrefs as pathname parsing).
 * Prefer feeding this from `useSelectedLayoutSegments()` in client components.
 */
export function buildBreadcrumbsFromLayoutSegments(
  segments: string[],
): BreadcrumbItem[] {
  if (segments.length === 0) {
    return [{ href: "/", label: "Home" }];
  }

  const items: BreadcrumbItem[] = [];
  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    acc += `/${seg}`;
    const parent = i > 0 ? segments[i - 1]! : null;
    items.push({
      href: acc,
      label: resolveLabel(seg, parent),
    });
  }
  return items;
}

/** Build cumulative trail for the pathname (app routes only). */
export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const path = pathname.replace(/\/$/, "") || "/";
  const segments = path === "/" ? [] : path.split("/").filter(Boolean);
  return buildBreadcrumbsFromLayoutSegments(segments);
}

/** True on `/` or `/inventory` where the leading house crumb is omitted. */
export function suppressLeadingHomeCrumb(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  return path === "/" || path === "/inventory";
}

/**
 * Apply a page-provided label (e.g. asset name) to the dynamic segment crumb.
 * When the trail ends with "Edit", the label replaces the previous crumb.
 */
export function withDetailLabel(
  items: BreadcrumbItem[],
  detailLabel: string | null,
): BreadcrumbItem[] {
  if (!detailLabel?.trim() || items.length === 0) return items;
  const label = detailLabel.trim();
  const next = items.map((i) => ({ ...i }));
  const last = next[next.length - 1]!;
  if (last.label === "Edit" && next.length >= 2) {
    next[next.length - 2]!.label = label;
  } else {
    last.label = label;
  }
  return next;
}
