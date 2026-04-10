"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getPostSignInPath } from "@/lib/postSignInRoute";

export default function PostSignInPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.profiles.current, isAuthenticated ? {} : "skip");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    if (profile === undefined) {
      return;
    }

    const path = getPostSignInPath(profile ?? undefined);
    const [pathname, query] = path.split("?");
    if (query) {
      router.replace(`${pathname}?${query}`);
    } else {
      router.replace(pathname);
    }
  }, [authLoading, isAuthenticated, profile, router]);

  if (!isAuthenticated && !authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] gap-3 px-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <p className="text-gray-600 text-sm">Setting up your workspace…</p>
    </div>
  );
}
