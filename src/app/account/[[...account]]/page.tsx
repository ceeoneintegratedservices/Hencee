"use client";

import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Account</h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to app
          </Link>
        </div>
        <div className="flex justify-center">
          <UserProfile path="/account" routing="path" />
        </div>
      </div>
    </div>
  );
}
