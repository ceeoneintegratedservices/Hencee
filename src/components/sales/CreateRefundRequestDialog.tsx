'use client';

import React, { useState } from 'react';
import { createRefundRequest } from '@/services/approvals';
import { useNotifications } from '@/components/Notification';

interface CreateRefundRequestDialogProps {
  saleId: string;
  saleAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CreateRefundRequestDialog({
  saleId,
  saleAmount,
  open,
  onOpenChange,
  onSuccess
}: CreateRefundRequestDialogProps) {
  const { showSuccess, showError } = useNotifications();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const refundAmount = parseFloat(amount);
    
    if (!refundAmount || refundAmount <= 0) {
      showError('Error', 'Please enter a valid amount');
      return;
    }
    
    if (refundAmount > saleAmount) {
      showError('Error', `Refund amount cannot exceed sale amount ($${saleAmount.toFixed(2)})`);
      return;
    }
    
    if (!reason.trim()) {
      showError('Error', 'Please provide a reason for the refund');
      return;
    }

    setLoading(true);
    try {
      await createRefundRequest({
        saleId,
        amount: refundAmount,
        reason: reason.trim()
      });
      
      showSuccess('Success', 'Refund request submitted successfully');
      setAmount('');
      setReason('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to create refund request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Refund Request</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Sale Amount: <strong>${saleAmount.toFixed(2)}</strong>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={saleAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Refund *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this refund is being requested..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                onOpenChange(false);
                setAmount('');
                setReason('');
              }}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !amount || !reason.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

