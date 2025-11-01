'use client';

import React, { useState, useEffect } from 'react';
import { 
  getPendingRefunds, 
  getRefundRequests,
  approveRefund, 
  rejectRefund,
  markRefundAsProcessed,
  type RefundRequest,
  RefundStatus
} from '@/services/approvals';
import { useNotifications } from '@/components/Notification';
import { usePermissions } from '@/hooks/usePermissions';

export default function RefundApprovalsTab() {
  const { showSuccess, showError } = useNotifications();
  const { hasPermission } = usePermissions();
  
  // Check permissions
  const canApprove = hasPermission('approve.refund');
  const canProcess = hasPermission('process_payments') || hasPermission('refund_payments');
  const isViewOnly = !canApprove && !canProcess;
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [approvedRefunds, setApprovedRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showApproved, setShowApproved] = useState(false);
  
  // Approve dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [refundMethod, setRefundMethod] = useState('');
  const [refundReference, setRefundReference] = useState('');
  
  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const response = await getPendingRefunds(page, 10);
      setRefunds(response.items || []);
      setTotal(response.total || 0);
      
      // Also fetch approved refunds if user can process them
      if (canProcess) {
        const approvedResponse = await getRefundRequests(page, 10, RefundStatus.APPROVED);
        setApprovedRefunds(approvedResponse.items || []);
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load refund requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleApproveClick = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setApproveDialogOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedRefund) return;

    try {
      await approveRefund(
        selectedRefund.id, 
        refundMethod || undefined, 
        refundReference || undefined
      );
      showSuccess('Success', 'Refund approved successfully');
      setApproveDialogOpen(false);
      setRefundMethod('');
      setRefundReference('');
      setSelectedRefund(null);
      fetchRefunds();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to approve refund');
      console.error(error);
    }
  };

  const handleRejectClick = (refund: RefundRequest) => {
    setSelectedRefund(refund);
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedRefund || !rejectionReason.trim()) {
      showError('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      await rejectRefund(selectedRefund.id, rejectionReason);
      showSuccess('Success', 'Refund rejected');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRefund(null);
      fetchRefunds();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to reject refund');
      console.error(error);
    }
  };

  const handleMarkAsProcessed = async (id: string) => {
    try {
      await markRefundAsProcessed(id);
      showSuccess('Success', 'Refund marked as processed');
      fetchRefunds();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to mark refund as processed');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading refund requests...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {showApproved ? 'Approved Refund Requests' : `Pending Refund Requests (${total})`}
        </h2>
        {canProcess && approvedRefunds.length > 0 && (
          <button
            onClick={() => setShowApproved(!showApproved)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            {showApproved ? 'Show Pending' : `Show Approved (${approvedRefunds.length})`}
          </button>
        )}
      </div>

      {showApproved ? (
        // Show approved refunds that need processing
        approvedRefunds.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
            <p className="text-lg font-medium">No approved refunds to process</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedRefunds.map((refund) => (
              <div 
                key={refund.id} 
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        ${refund.amount.toFixed(2)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        Sale ID: {refund.saleId.slice(0, 8)}...
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Approved
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">
                      <strong>Reason:</strong> {refund.reason}
                    </p>
                    
                    {refund.refundMethod && (
                      <p className="text-sm text-gray-600">
                        <strong>Method:</strong> {refund.refundMethod}
                      </p>
                    )}
                    {refund.refundReference && (
                      <p className="text-sm text-gray-600">
                        <strong>Reference:</strong> {refund.refundReference}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-500 mt-2">
                      Approved: {refund.approvedAt ? new Date(refund.approvedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  {canProcess && refund.status === RefundStatus.APPROVED && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleMarkAsProcessed(refund.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Mark as Processed
                      </button>
                    </div>
                  )}
                  {refund.status === RefundStatus.PROCESSED && (
                    <div className="ml-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                        Processed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : refunds.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1h-2m2 0h2" />
          </svg>
          <p className="text-lg font-medium">No pending refund requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <div 
              key={refund.id} 
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      ${refund.amount.toFixed(2)}
                    </h3>
                    <span className="text-sm text-gray-500">
                      Sale ID: {refund.saleId.slice(0, 8)}...
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-2">
                    <strong>Reason:</strong> {refund.reason}
                  </p>
                  
                  <p className="text-sm text-gray-600">
                    Requested by: {refund.requesterName || 'Unknown'}
                  </p>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    Requested: {new Date(refund.createdAt).toLocaleString()}
                  </p>
                </div>

                {!isViewOnly && canApprove && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApproveClick(refund)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(refund)}
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

      {/* Approve Dialog */}
      {approveDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Refund</h3>
            <div className="space-y-4">
              <p className="text-gray-700">
                Approving refund of <strong>${selectedRefund?.amount.toFixed(2)}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Method (Optional)
                </label>
                <input
                  type="text"
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  placeholder="e.g., Bank Transfer, Credit Card"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Reference (Optional)
                </label>
                <input
                  type="text"
                  value={refundReference}
                  onChange={(e) => setRefundReference(e.target.value)}
                  placeholder="e.g., REF-12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setApproveDialogOpen(false);
                    setRefundMethod('');
                    setRefundReference('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveSubmit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Approve Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Refund</h3>
            <div className="space-y-4">
              <p className="text-gray-700">
                Rejecting refund of <strong>${selectedRefund?.amount.toFixed(2)}</strong>
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
                  Reject Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

