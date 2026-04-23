"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getPostSignInPath } from "@/lib/postSignInRoute";

/**
 * Post-sign-in must coordinate Clerk (session cookie) with Convex (JWT).
 * If we only look at `useConvexAuth().isAuthenticated`, we can get a false negative
 * while the Clerk→Convex token is still loading — `/post-signin` would send users to `/login`,
 * and `/login` immediately sends signed-in users back here → an infinite loop.
 *
 * If Convex never authenticates (misconfigured JWT template), redirecting to `/login` also
 * loops because the login page auto-redirects anyone with a Clerk `userId` to `/post-signin`.
 */
export default function PostSignInPage() {
  const router = useRouter();
  const { isLoaded: clerkLoaded, userId } = useAuth();
  const { isLoading: convexAuthLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.profiles.current, isAuthenticated ? {} : "skip");

  // Not signed in with Clerk → login
  useEffect(() => {
    if (!clerkLoaded) return;
    if (!userId) {
      router.replace("/login");
    }
  }, [clerkLoaded, userId, router]);

  // Clerk + Convex ready → route by profile
  useEffect(() => {
    if (!clerkLoaded || !userId) return;
    if (convexAuthLoading) return;
    if (!isAuthenticated) return;
    if (profile === undefined) return;

    const path = getPostSignInPath(profile ?? undefined);
    const [pathname, query] = path.split("?");
    if (query) {
      router.replace(`${pathname}?${query}`);
    } else {
      router.replace(pathname);
    }
  }, [clerkLoaded, userId, convexAuthLoading, isAuthenticated, profile, router]);

  if (!clerkLoaded) {
    return <PostSignInSpinner label="Loading…" />;
  }

  if (!userId) {
    return null;
  }

  // Clerk session exists: wait for Convex handshake (do not redirect to /login here)
  if (convexAuthLoading) {
    return <PostSignInSpinner label="Connecting to your workspace…" />;
  }

  // Clerk signed in but Convex never authenticated — do NOT send to /login (would loop)
  if (!isAuthenticated) {
    return <ConvexAuthFailed />;
  }

  if (profile === undefined) {
    return <PostSignInSpinner label="Setting up your workspace…" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] gap-3 px-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <p className="text-gray-600 text-sm">Taking you to the app…</p>
    </div>
  );
}

function PostSignInSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] gap-3 px-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <p className="text-gray-600 text-sm">{label}</p>
    </div>
  );
}

function ConvexAuthFailed() {
  const { signOut } = useClerk();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] gap-4 px-6 text-center max-w-md mx-auto">
      <p className="text-lg font-semibold text-gray-900">Could not connect your session to the app</p>
      <p className="text-sm text-gray-600">
        Clerk signed you in, but the app could not verify your account with Convex. Check that your Clerk JWT template for Convex is configured and that{" "}
        <code className="rounded bg-gray-200 px-1">NEXT_PUBLIC_CONVEX_URL</code> matches your deployment.
      </p>
      <button
        type="button"
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        onClick={() => void signOut({ redirectUrl: "/login" })}
      >
        Sign out and try again
      </button>
    </div>
  );
}
