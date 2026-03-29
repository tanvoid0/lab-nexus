"use server";

import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { writeAuditLog } from "@/lib/audit";
import {
  failure,
  zodErrorToFieldErrors,
  type ActionResult,
} from "@/lib/form/action-result";
import {
  projectCreateSchema,
  projectMemberAddSchema,
} from "@/lib/schemas/project";
import { prisma } from "@/lib/db";
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
  return hasAnyRole(roles, ["ADMIN", "RESEARCHER"]);
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
  };
  const parsed = projectCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return failure({ fieldErrors: zodErrorToFieldErrors(parsed.error) });
  }

  const name = parsed.data.name.trim();
  let slug = parsed.data.slug?.trim() || slugify(name);
  const taken = await prisma.project.findUnique({ where: { slug } });
  if (taken) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  let project;
  try {
    project = await prisma.project.create({
      data: { name, slug },
    });
  } catch (e) {
    return failure({
      formError: e instanceof Error ? e.message : "Could not create project.",
    });
  }

  await writeAuditLog({
    userId: session.user.id,
    entityType: "Project",
    entityId: project.id,
    action: "CREATE",
    diff: { name },
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
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

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
  });
  if (!project) return failure({ formError: "Project not found." });

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) {
    return failure({
      formError: "No user with that email. They must sign up first.",
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
    entityType: "Project",
    entityId: project.id,
    action: "MEMBER_ADD",
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
    entityType: "Project",
    entityId: projectId,
    action: "MEMBER_REMOVE",
    diff: { memberId: row.id },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
