"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export default function PickRolePage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const roles = useQuery(api.roles.listForRoleRequest, isAuthenticated ? {} : "skip");
  const status = useQuery(api.roleRequests.myStatus, isAuthenticated ? {} : "skip");
  const createRequest = useMutation(api.roleRequests.createRequest);

  const [selected, setSelected] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!status || status.isCustomer) {
      return;
    }
    if (!status.mustSelectRole && !status.pendingRoleRequest && status.approvalStatus === "approved") {
      router.replace("/post-signin");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setError("Choose a role");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await createRequest({ requestedRoleId: selected as Id<"roles"> });
      router.replace("/post-signin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated || status === undefined || status === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (status.isCustomer) {
    router.replace("/customer-portal");
    return null;
  }

  if (status.pendingRoleRequest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 shadow-sm border text-center">
          <h1 className="text-xl font-semibold text-gray-900">Request submitted</h1>
          <p className="mt-3 text-sm text-gray-600">
            You requested: <strong>{status.pendingRoleRequest.roleName}</strong>. An administrator will
            review your request. You&apos;ll get access after approval.
          </p>
          <p className="mt-6 text-xs text-gray-500">You can leave this page — check back after approval.</p>
        </div>
      </div>
    );
  }

  if (!status.mustSelectRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f8] px-4 py-12">
      <div className="max-w-lg w-full rounded-2xl bg-white p-8 shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Choose your role</h1>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Select the role that best matches your job. An administrator will approve your request.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          {roles === undefined ? (
            <p className="text-sm text-gray-500 text-center">Loading roles…</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-amber-800 text-center">
              No roles available yet. Ask an admin to run <code className="text-xs">roles:seedRoles</code> in Convex.
            </p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {roles.map((r) => (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50">
                    <input
                      type="radio"
                      name="role"
                      value={r.id}
                      checked={selected === r.id}
                      onChange={() => setSelected(r.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-medium text-gray-900">{r.name}</span>
                      {r.description ? (
                        <span className="block text-xs text-gray-500 mt-0.5">{r.description}</span>
                      ) : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {error ? <p className="text-sm text-red-600 text-center">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !selected || !roles?.length}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      </div>
    </div>
  );
}
