import Image from "next/image";
import { LoginForm } from "./login-form";
import { ContinueToAppLink } from "./continue-to-app-link";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="relative block size-16">
          <Image
            src="/logo.svg"
            alt="Vehicle Computing Lab"
            fill
            className="object-contain"
            sizes="64px"
            priority
          />
        </span>
        <h1 className="text-xl font-semibold text-primary">Vehicle Computing Lab</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your lab account
        </p>
      </div>
      <LoginForm />
      {process.env.NODE_ENV === "development" ? (
        <p className="mt-8 max-w-md text-center text-xs text-muted-foreground">
          Local development: after seeding the database, use the demo account buttons on the form
          or sign in manually. Demo credentials are not shown on deployed builds.
        </p>
      ) : null}
      <ContinueToAppLink />
    </div>
  );
}
