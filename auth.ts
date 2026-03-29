/**
 * Auth.js configuration (Credentials MVP).
 *
 * **Multi-role:** `User.roles` from Prisma is copied into the JWT and `session.user.roles`.
 * Dev-only quick sign-in (`devQuickLoginAction`) uses the same demo users as
 * `prisma/seed` via `lib/dev/demo-auth.ts` and only runs when `NODE_ENV === "development"`.
 * When adding **OIDC/SAML/LDAP**, register a new provider and merge groups into `roles` using
 * `mapExternalProfileToRoles` from `@/lib/auth/roles` inside the provider callback or `jwt` —
 * keep the same `string[]` contract; do not add a scalar `role` column.
 *
 * **Email domains:** optional `LDAP_ALLOWED_DOMAINS` (comma-separated). When non-empty,
 * credential sign-in is limited to those domains (exact host or subdomain match).
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { notDeleted } from "@/lib/prisma/active-scopes";
import { isEmailFromAllowedDomains, parseAllowedEmailDomains } from "@/lib/auth/allowed-email-domains";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const email = parsed.data.email.toLowerCase().trim();
        const allowedDomains = parseAllowedEmailDomains(process.env.LDAP_ALLOWED_DOMAINS);
        if (!isEmailFromAllowedDomains(email, allowedDomains)) {
          return null;
        }
        const user = await prisma.user.findFirst({
          where: { email, ...notDeleted },
        });
        if (!user) return null;
        const ok = await compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          roles: user.roles,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.roles = user.roles;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.roles = (token.roles as string[]) ?? [];
      }
      return session;
    },
  },
});
