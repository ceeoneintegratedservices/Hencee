"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, useAuth, useClerk } from "@clerk/nextjs";
import { getClerkHostedAccountLinks } from "@/lib/clerkHostedUrls";

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function ApprovalGate({ variant }: { variant: "approval-pending" | "approval-rejected" }) {
  const { signOut } = useClerk();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] px-4 py-10">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-lg">
        <h2 className="text-xl font-bold text-center text-gray-900">
          {variant === "approval-pending" ? "Account pending approval" : "Account not approved"}
        </h2>
        <p className="mt-3 text-center text-sm text-gray-600">
          {variant === "approval-pending"
            ? "An administrator must approve your account before you can use the app."
            : "Your signup request was not approved. Contact an administrator if you need access."}
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          onClick={() => void signOut({ redirectUrl: "/login" })}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const { isLoaded, userId } = useAuth();
  const hosted = getClerkHostedAccountLinks();

  const isApprovalNotice = notice === "approval-pending" || notice === "approval-rejected";

  useEffect(() => {
    if (!isLoaded || !userId) {
      return;
    }
    if (isApprovalNotice) {
      return;
    }
    router.replace("/post-signin");
  }, [isLoaded, userId, isApprovalNotice, router]);

  if (!isLoaded) {
    return <LoginLoading />;
  }

  if (userId && isApprovalNotice) {
    return <ApprovalGate variant={notice as "approval-pending" | "approval-rejected"} />;
  }

  if (userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        {notice === "password" && (
          <div
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950"
            role="status"
          >
            <p className="font-medium">Reset your password with Clerk</p>
            <p className="mt-1 text-blue-900/90">
              Use <strong>Forgot password</strong> on the sign-in form below. If you do not see it, open
              Clerk&apos;s hosted sign-in in another tab.
            </p>
            {hosted && (
              <p className="mt-2">
                <a
                  href={hosted.signIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900"
                >
                  Open Clerk sign-in (hosted)
                </a>
              </p>
            )}
          </div>
        )}
        {notice === "verify" && (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
            role="status"
          >
            <p className="font-medium">Verify your email with Clerk</p>
            <p className="mt-1 text-emerald-900/90">
              New accounts complete email verification during Clerk sign-up. Existing users can sign in
              below; Clerk will prompt you if verification is still required.
            </p>
            {hosted && (
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                <a
                  href={hosted.signUp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
                >
                  Clerk sign-up (hosted)
                </a>
                <a
                  href={hosted.userProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
                >
                  Account &amp; security (hosted)
                </a>
              </p>
            )}
          </div>
        )}
        <SignIn
          routing="hash"
          signUpUrl="/signup"
          fallbackRedirectUrl="/post-signin"
          appearance={{
            elements: {
              rootBox: "mx-auto",
            },
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
