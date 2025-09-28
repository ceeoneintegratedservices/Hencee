'use client';
import React from 'react';
import { ExpenseItem, ExpensesDataService } from '@/services/ExpensesDataService';

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  expense: ExpenseItem | null;
  onClose: () => void;
  onToggleDecision?: (expense: ExpenseItem, target: 'Approved' | 'Rejected') => void;
}

export default function ExpenseDetailsModal({ isOpen, expense, onClose, onToggleDecision }: ExpenseDetailsModalProps) {
  if (!isOpen || !expense) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Expense Details</h2>
          <button onClick={onClose} className="text-red-500 hover:text-red-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Title</p>
              <p className="text-sm font-medium text-gray-900">{expense.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="text-sm font-medium text-gray-900">{ExpensesDataService.formatCurrency(expense.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Category</p>
              <p className="text-sm font-medium text-gray-900">{expense.category}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-sm font-medium text-gray-900">{expense.department}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Requested By</p>
              <p className="text-sm font-medium text-gray-900">{expense.requestedBy} ({expense.requestedByEmail})</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ExpensesDataService.getStatusColor(expense.status)}`}>
                {expense.status}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <p className="text-sm text-gray-800">{expense.description}</p>
          </div>

          {(expense.vendor || expense.invoiceNumber) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {expense.vendor && (
                <div>
                  <p className="text-xs text-gray-500">Vendor</p>
                  <p className="text-sm font-medium text-gray-900">{expense.vendor}</p>
                </div>
              )}
              {expense.invoiceNumber && (
                <div>
                  <p className="text-xs text-gray-500">Invoice Number</p>
                  <p className="text-sm font-medium text-gray-900">{expense.invoiceNumber}</p>
                </div>
              )}
            </div>
          )}

          {expense.receiptImage && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Invoice / Receipt</p>
              <div className="border rounded-lg overflow-hidden">
                <img src={expense.receiptImage} alt="Invoice" className="w-full" />
              </div>
            </div>
          )}

          {/* Toggle Decision within 1 hour */}
          {['Approved', 'Rejected'].includes(expense.status) && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Decision Controls</p>
              {expense.decisionDate && ExpensesDataService.canToggleDecision(expense) ? (
                <div className="flex items-center gap-2">
                  {expense.status === 'Approved' ? (
                    <button
                      onClick={() => onToggleDecision && onToggleDecision(expense, 'Rejected')}
                      className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                    >
                      Toggle to Rejected
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleDecision && onToggleDecision(expense, 'Approved')}
                      className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                    >
                      Toggle to Approved
                    </button>
                  )}
                  <span className="text-xs text-gray-500">You can toggle within 1 hour of decision.</span>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Toggle window expired. You can no longer change the decision.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
