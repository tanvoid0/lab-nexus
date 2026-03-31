import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { PublicInventoryGrid } from "@/components/public/public-inventory-grid";
import { ProjectsDirectory } from "@/components/projects/projects-directory";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicPortfolioData } from "@/lib/portfolio/public-showcase";
import { loadLookupLabelMaps } from "@/lib/reference/lookup-label-maps";
import { prisma } from "@/lib/db";

export default async function PublicHomePage() {
  const session = await auth();
  const [{ featuredProjects, featuredAssets, assetCount, projectCount, availableAssetCount }, labelMaps] =
    await Promise.all([getPublicPortfolioData(), loadLookupLabelMaps(prisma)]);

  const conditionLabels = Object.fromEntries(labelMaps.conditionLabelByCode);
  const operationalLabels = Object.fromEntries(labelMaps.operationalStatusLabelByCode);

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-[140rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8 2xl:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-3 font-semibold text-primary">
            <span className="relative block size-10 shrink-0">
              <Image
                src="/logo.svg"
                alt="Vehicle Computing Lab"
                fill
                className="object-contain"
                sizes="40px"
                priority
              />
            </span>
            <span className="min-w-0">
              <span className="block">Vehicle Computing Lab</span>
              <span className="block text-xs font-normal text-muted-foreground">
                Public project and equipment portfolio
              </span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="#projects">Browse projects</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="#inventory">Browse inventory</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={session?.user ? "/dashboard" : "/login"}>
                {session?.user ? "Open dashboard" : "Sign in"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[140rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 2xl:px-10">
        <section className="grid gap-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/[0.08] via-background to-background xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">
                Lab demo portfolio
              </p>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
                  Demo projects, equipment, and request flows in one place
                </h1>
                <p className="max-w-2xl text-base text-muted-foreground">
                  This public portfolio highlights how Vehicle Computing Lab organizes project work,
                  showcases equipment, and hands visitors into the student request workflow.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#projects">View project portfolio</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="#inventory">Browse equipment showcase</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href={session?.user ? "/dashboard" : "/login"}>
                  {session?.user ? "Open dashboard" : "Sign in to request"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 bg-muted/30 p-6 sm:p-8">
            <Card className="border-primary/15 bg-background/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary">What this demo shows</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Project profiles with linked documents and assigned equipment.</p>
                <p>Read-only item details that mirror the app without admin-only controls.</p>
                <p>Public visitors can review first, then sign in to request items.</p>
              </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-primary">Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{projectCount}</p>
                  <p className="text-sm text-muted-foreground">Profiles and workstreams on display.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-primary">Inventory items</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{assetCount}</p>
                  <p className="text-sm text-muted-foreground">Catalog entries available to demo.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-primary">Available now</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{availableAssetCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Items currently ready to be requested after sign-in.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="border-border bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary">Selected work</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Open project pages to review context, linked references, and assigned equipment.
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary">Equipment showcase</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Inventory cards and detail pages stay public, but request actions stay safely behind
              login.
            </CardContent>
          </Card>
          <Card className="border-border bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary">Straightforward handoff</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Visitors can explore the portfolio first, then continue into the student request
              flow when they are ready.
            </CardContent>
          </Card>
        </section>

        <section id="projects" className="space-y-4 scroll-mt-20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/70">
                Portfolio
              </p>
              <h2 className="text-2xl font-semibold text-primary">Featured projects</h2>
              <p className="text-sm text-muted-foreground">
                Existing project profiles, documents, and assigned equipment surfaced as a
                public showcase.
              </p>
            </div>
          </div>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-primary">Project portfolio</CardTitle>
              <CardDescription className="max-w-2xl text-sm">
                Each entry opens a public project page with overview details and linked inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectsDirectory
                projects={featuredProjects}
                canCreateProject={false}
                hrefBase="/portfolio/projects"
              />
            </CardContent>
          </Card>
        </section>

        <section id="inventory" className="space-y-4 scroll-mt-20">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/70">
                Showcase
              </p>
              <h2 className="text-2xl font-semibold text-primary">Inventory highlights</h2>
              <p className="text-sm text-muted-foreground">
                Public item pages expose the useful read-only details while leaving request and
                management controls inside the app.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign in to browse the full app</Link>
            </Button>
          </div>
          <PublicInventoryGrid
            assets={featuredAssets}
            conditionLabels={conditionLabels}
            operationalLabels={operationalLabels}
          />
        </section>

        <section>
          <Card className="border-primary/15 bg-background">
            <CardHeader>
              <CardTitle className="text-primary">Request equipment with a student account</CardTitle>
              <CardDescription>
                Public visitors can review projects and inventory first. Requests, cart actions,
                and tracking stay inside the authenticated lab workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/login">Go to login</Link>
              </Button>
              {session?.user ? (
                <Button asChild variant="outline">
                  <Link href="/dashboard">Open your dashboard</Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
