"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useConvex } from "convex/react";
import { useEffect, type ReactNode } from "react";
import { registerConvexClient } from "@/lib/convexClient";

function makeConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    return null;
  }
  return new ConvexReactClient(url);
}

const convexSingleton = makeConvexClient();

function ConvexClientRegistrar({ children }: { children: ReactNode }) {
  const cx = useConvex();
  useEffect(() => {
    registerConvexClient(cx);
    return () => registerConvexClient(null);
  }, [cx]);
  return <>{children}</>;
}

function MissingClerkConfig() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-amber-50 p-6 text-center text-amber-950">
      <p className="text-lg font-semibold">Clerk is required</p>
      <p className="max-w-md text-sm">
        Add <code className="rounded bg-amber-100 px-1.5 py-0.5">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> to your
        environment (e.g. <code className="rounded bg-amber-100 px-1.5 py-0.5">.env.local</code>).
      </p>
    </div>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <MissingClerkConfig />;
  }

  if (!convexSingleton) {
    return (
      <>
        {process.env.NODE_ENV === "development" ? (
          <div className="bg-amber-50 p-2 text-center text-sm text-amber-900">
            Set NEXT_PUBLIC_CONVEX_URL in .env for Convex (data features).
          </div>
        ) : null}
        <ClerkProvider publishableKey={publishableKey}>
          {children}
        </ClerkProvider>
      </>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convexSingleton} useAuth={useAuth}>
        <ConvexClientRegistrar>{children}</ConvexClientRegistrar>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
