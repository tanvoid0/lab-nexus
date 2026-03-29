import Link from "next/link";
import { auth } from "@/auth";
import { hasRole, LAB_ROLE } from "@/lib/auth/roles";
import { isAiAssistantEnabled } from "@/lib/ai/config";
import { redirect } from "next/navigation";
import { AppearanceControlsLazy } from "@/components/settings/appearance-controls-lazy";
import { LabCurrenciesCardTitle } from "@/components/settings/lab-currencies-card-title";
import { RevalidateUserSettingsOnMount } from "@/components/settings/revalidate-user-settings-on-mount";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = hasRole(session.user.roles ?? [], LAB_ROLE.ADMIN);
  const assistantOn = isAiAssistantEnabled();

  return (
    <div className="space-y-6">
      <RevalidateUserSettingsOnMount />
      <div>
        <h1 className="text-2xl font-semibold text-primary">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Personal preferences follow your account. Lab-wide options appear here when you are an
          admin.
        </p>
      </div>
      {assistantOn ? (
        <Card className="max-w-lg border-border">
          <CardHeader>
            <CardTitle className="text-primary">Lab assistant</CardTitle>
            <CardDescription>
              When Gemini is configured, use the robot button in the top toolbar (next to theme). The
              lab assistant is experimental—open the panel for the warning, then check the box to confirm
              you understand the risks (saved on this device for your account). It can search inventory,
              your checkouts, and reference labels; admins also get recent audit snippets.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      <Card className="max-w-lg border-border">
        <CardHeader>
          <CardTitle className="text-primary">Appearance</CardTitle>
          <CardDescription>
            Theme and list density sync to the server; this device also keeps a local copy
            for fast startup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceControlsLazy />
        </CardContent>
      </Card>
      {isAdmin ? (
        <Card className="max-w-lg border-border">
          <CardHeader>
            <LabCurrenciesCardTitle />
            <CardDescription>
              Functional (reporting) currency and allowed vendor transaction codes for procurement
              and future financial fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Same policy surface as typical ERP inventory: one base currency plus explicit foreign
              currencies for invoices and POs.
            </p>
            <Button asChild>
              <Link href="/settings/currencies">Configure lab currencies</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
