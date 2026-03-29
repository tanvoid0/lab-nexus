import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { ProjectMembersPanel } from "@/components/projects/project-members-panel";
import { Button } from "@/components/ui/button";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const roles = session!.user!.roles ?? [];
  const canManage = hasAnyRole(roles, ["ADMIN", "RESEARCHER"]);

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { email: true, name: true } } },
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 h-auto px-2 py-1 text-muted-foreground">
            <Link href="/projects">← Projects</Link>
          </Button>
          <h1 className="text-2xl font-semibold text-primary">{project.name}</h1>
          {project.slug ? (
            <p className="font-mono text-sm text-muted-foreground">{project.slug}</p>
          ) : null}
        </div>
      </div>

      <ProjectMembersPanel
        projectId={project.id}
        members={project.members.map((m) => ({
          id: m.id,
          user: m.user,
        }))}
        canManage={canManage}
      />
    </div>
  );
}
