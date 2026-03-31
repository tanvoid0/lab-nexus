"use server";

import { auth } from "@/auth";
import { hasAnyRole, LAB_ROLES_STAFF } from "@/lib/auth/roles";
import { AuditAction, AuditEntityType } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  success,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import {
  projectCreateSchema,
  projectMemberAddSchema,
  projectUpdateDetailsSchema,
  projectUrlEntryListSchema,
} from "@/lib/schemas/project";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(name: string) {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return s || "project";
}

function canManageProjects(roles: string[]) {
  return hasAnyRole(roles, LAB_ROLES_STAFF);
}

function parseStoredUrlListJson(raw: string, fieldLabel: string) {
  const trimmed = raw.trim();
  if (!trimmed) return projectUrlEntryListSchema.parse([]);
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${fieldLabel} must be valid JSON.`);
  }
  return projectUrlEntryListSchema.parse(parsed);
}

export async function createProjectAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });

  const roles = session.user.roles ?? [];
  if (!canManageProjects(roles)) {
    return failure({ formError: "You cannot create projects." });
  }

  const raw = {
    name: formData.get("name"),
    slug: (formData.get("slug") as string) || undefined,
    status: formData.get("status"),
  };
  const parsed = projectCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const name = parsed.data.name.trim();
  let slug = parsed.data.slug?.trim() || slugify(name);
  const taken = await prisma.project.findFirst({
    where: { slug, ...notDeleted },
  });
  if (taken) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  let project;
  try {
    project = await prisma.project.create({
      data: { name, slug, status: parsed.data.status },
    });
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Could not create project.",
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Project,
    entityId: project.id,
    action: AuditAction.CREATE,
    diff: { name, status: parsed.data.status },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectDetailsAction(
  _prev: ActionResult<{ saved: true }>,
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });

  const roles = session.user.roles ?? [];
  if (!canManageProjects(roles)) {
    return failure({ formError: "You cannot edit project details." });
  }

  const raw = {
    projectId: formData.get("projectId"),
    status: formData.get("status"),
    description: formData.get("description") as string | undefined,
    webLinksJson: String(formData.get("webLinksJson") ?? "[]"),
    documentLinksJson: String(formData.get("documentLinksJson") ?? "[]"),
  };

  const parsed = projectUpdateDetailsSchema.safeParse({
    projectId: raw.projectId,
    status: raw.status,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    webLinksJson: raw.webLinksJson,
    documentLinksJson: raw.documentLinksJson,
  });

  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, ...notDeleted },
  });
  if (!project) return failure({ formError: "Project not found." });

  let webLinks;
  let documentLinks;
  try {
    webLinks = parseStoredUrlListJson(parsed.data.webLinksJson, "Web links");
    documentLinks = parseStoredUrlListJson(
      parsed.data.documentLinksJson,
      "Document links",
    );
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Invalid link data.",
    });
  }

  const description =
    parsed.data.description?.trim() === ""
      ? null
      : parsed.data.description?.trim() ?? null;

  const before = {
    status: project.status,
    description: project.description,
    webLinks: project.webLinks,
    documentLinks: project.documentLinks,
  };

  await prisma.project.update({
    where: { id: project.id },
    data: {
      status: parsed.data.status,
      description,
      webLinks,
      documentLinks,
    },
  });

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Project,
    entityId: project.id,
    action: AuditAction.UPDATE,
    diff: {
      status: { from: before.status, to: parsed.data.status },
      description: { from: before.description, to: description },
      webLinks: { from: before.webLinks, to: webLinks },
      documentLinks: { from: before.documentLinks, to: documentLinks },
    },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  return success({ saved: true });
}

export async function addProjectMemberAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });

  const roles = session.user.roles ?? [];
  if (!canManageProjects(roles)) {
    return failure({ formError: "You cannot manage members." });
  }

  const raw = {
    projectId: formData.get("projectId"),
    email: formData.get("email"),
  };
  const parsed = projectMemberAddSchema.safeParse({
    projectId: raw.projectId,
    email: typeof raw.email === "string" ? raw.email.trim() : "",
  });
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, ...notDeleted },
  });
  if (!project) return failure({ formError: "Project not found." });

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email.toLowerCase(), ...notDeleted },
  });
  if (!user) {
    return failure({
      formError:
        "No active user with that email. They must have an account and not be deactivated.",
    });
  }

  try {
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: user.id,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique") || msg.includes("duplicate")) {
      return failure({ formError: "That user is already on this project." });
    }
    return failure({ formError: msg || "Could not add member." });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Project,
    entityId: project.id,
    action: AuditAction.MEMBER_ADD,
    diff: { email: user.email },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${project.id}`);
  return { ok: true };
}

export async function removeProjectMemberAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return failure({ formError: "Sign in required." });

  const roles = session.user.roles ?? [];
  if (!canManageProjects(roles)) {
    return failure({ formError: "You cannot manage members." });
  }

  const memberId = formData.get("memberId");
  const projectId = formData.get("projectId");
  if (typeof memberId !== "string" || typeof projectId !== "string") {
    return failure({ formError: "Invalid request." });
  }

  const row = await prisma.projectMember.findFirst({
    where: { id: memberId, projectId },
  });
  if (!row) return failure({ formError: "Membership not found." });

  await prisma.projectMember.delete({ where: { id: row.id } });

  await writeAuditLog({
    userId: session.user.id,
    entityType: AuditEntityType.Project,
    entityId: projectId,
    action: AuditAction.MEMBER_REMOVE,
    diff: { memberId: row.id },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
