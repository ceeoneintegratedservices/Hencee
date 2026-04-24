"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings#account-section");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 text-gray-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          Redirecting to account settings...
        </div>
      </div>
    </div>
  );
}
