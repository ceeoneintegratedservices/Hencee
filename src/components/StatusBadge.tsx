'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

type StatusKey = 'PENDING' | 'COMPLETED' | 'RETURNED' | 'DAMAGED' | 'CANCELED';

const statusConfig: Record<StatusKey, { color: string; icon: string; label: string }> = {
  PENDING: { 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: '⏳',
    label: 'Pending'
  },
  COMPLETED: { 
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: '✓',
    label: 'Completed'
  },
  RETURNED: { 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '↩️',
    label: 'Returned'
  },
  DAMAGED: { 
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: '⚠️',
    label: 'Damaged'
  },
  CANCELED: { 
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: '✕',
    label: 'Canceled'
  },
};

const isValidStatus = (status: string): status is StatusKey => {
  return status in statusConfig;
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const upperStatus = status?.toUpperCase() || 'PENDING';
  const config = isValidStatus(upperStatus) ? statusConfig[upperStatus] : statusConfig.PENDING;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 border rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
