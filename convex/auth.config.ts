import type { AuthConfig } from "convex/server";

const clerkDomain =
  process.env.CLERK_ISSUER_URL ?? process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL;

if (!clerkDomain) {
  throw new Error(
    "Set CLERK_ISSUER_URL or NEXT_PUBLIC_CLERK_FRONTEND_API_URL for Clerk auth (Convex + Clerk)."
  );
}

export default {
  providers: [
    {
      domain: clerkDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
