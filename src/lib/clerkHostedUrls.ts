/**
 * Optional Clerk Frontend API (Accounts) URLs for linking outside the embedded /login UI.
 * Requires NEXT_PUBLIC_CLERK_FRONTEND_API_URL (same host as Clerk issuer / accounts.dev).
 */
export function getClerkFrontendBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL;
  if (!raw?.trim()) return null;
  return raw.replace(/\/$/, "");
}

export function getClerkHostedAccountLinks(): {
  signIn: string;
  signUp: string;
  userProfile: string;
} | null {
  const base = getClerkFrontendBase();
  if (!base) return null;
  return {
    signIn: `${base}/sign-in`,
    signUp: `${base}/sign-up`,
    userProfile: `${base}/user`,
  };
}
