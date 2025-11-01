'use client';

import React, { useState, useEffect } from 'react';
import { 
  getPendingAccounts, 
  approveAccount, 
  rejectAccount,
  type AccountApproval
} from '@/services/approvals';
import { useNotifications } from '@/components/Notification';
import { usePermissions } from '@/hooks/usePermissions';

export default function AccountApprovalsTab() {
  const { showSuccess, showError } = useNotifications();
  const { hasPermission } = usePermissions();
  
  // Check if user can approve/reject accounts
  const canApprove = hasPermission('approve.user_accounts');
  const isViewOnly = !canApprove;
  const [accounts, setAccounts] = useState<AccountApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountApproval | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await getPendingAccounts(page, 10);
      setAccounts(response.items || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load account approvals');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [page]);

  const handleApprove = async (userId: string) => {
    try {
      await approveAccount(userId);
      showSuccess('Success', 'Account approved successfully');
      fetchAccounts(); // Refresh list
    } catch (error: any) {
      showError('Error', error.message || 'Failed to approve account');
      console.error(error);
    }
  };

  const handleRejectClick = (account: AccountApproval) => {
    setSelectedAccount(account);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedAccount || !rejectionReason.trim()) {
      showError('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      await rejectAccount(selectedAccount.id, rejectionReason);
      showSuccess('Success', 'Account rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedAccount(null);
      fetchAccounts(); // Refresh list
    } catch (error: any) {
      showError('Error', error.message || 'Failed to reject account');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading account approvals...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Pending Account Approvals ({total})
        </h2>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <p className="text-lg font-medium">No pending account approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div 
              key={account.id} 
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{account.name}</h3>
                  <p className="text-gray-600 mt-1">{account.email}</p>
                  {account.phone && (
                    <p className="text-gray-600">{account.phone}</p>
                  )}
                  <div className="mt-2">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {account.roleName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Requested: {new Date(account.createdAt).toLocaleString()}
                  </p>
                </div>

                {!isViewOnly && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(account.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(account)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {isViewOnly && (
                  <div className="ml-4">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
                      View Only
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="py-2 px-4 text-gray-600">
            Page {page} of {Math.ceil(total / 10)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / 10)}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Account</h3>
            <div className="space-y-4">
              <p className="text-gray-700">
                Rejecting account for: <strong>{selectedAccount?.name}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setRejectDialogOpen(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

