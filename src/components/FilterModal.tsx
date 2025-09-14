"use client";

import { useState } from "react";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterData) => void;
}

interface FilterData {
  orderType: string[];
  status: string;
  customer: string;
  amountFrom: string;
  amountTo: string;
}

export default function FilterModal({ isOpen, onClose, onApply }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterData>({
    orderType: [],
    status: "All",
    customer: "All",
    amountFrom: "0.00",
    amountTo: "0.00"
  });

  const handleOrderTypeChange = (type: string) => {
    setFilters(prev => ({
      ...prev,
      orderType: prev.orderType.includes(type)
        ? prev.orderType.filter(t => t !== type)
        : [...prev.orderType, type]
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 flex items-start justify-center z-50 pt-20" onClick={handleOverlayClick}>
      <div className="bg-white rounded-xl p-6 w-[450px] max-h-[500px] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-semibold text-[#45464e]">Filter</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Order Type Section */}
        <div className="mb-6">
          <h3 className="text-[14px] font-medium text-[#45464e] mb-3">Order Type</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.orderType.includes("Home Delivery")}
                onChange={() => handleOrderTypeChange("Home Delivery")}
                className="w-4 h-4 text-[#02016a] border-gray-300 rounded focus:ring-[#02016a]"
              />
              <span className="text-[14px] text-[#45464e]">Home Delivery</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.orderType.includes("Pick Up")}
                onChange={() => handleOrderTypeChange("Pick Up")}
                className="w-4 h-4 text-[#02016a] border-gray-300 rounded focus:ring-[#02016a]"
              />
              <span className="text-[14px] text-[#45464e]">Pick Up</span>
            </label>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        {/* Status Section */}
        <div className="mb-6">
          <h3 className="text-[14px] font-medium text-[#45464e] mb-3">Status</h3>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Canceled">Canceled</option>
            <option value="In-Progress">In-Progress</option>
          </select>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        {/* Customer Section */}
        <div className="mb-6">
          <h3 className="text-[14px] font-medium text-[#45464e] mb-3">Customer</h3>
          <select
            value={filters.customer}
            onChange={(e) => setFilters(prev => ({ ...prev, customer: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
          >
            <option value="All">All</option>
            <option value="Alphabetical">Alphabetical</option>
            <option value="By Total (Highest to Lowest)">By Total (Highest to Lowest)</option>
            <option value="Janet Adebayo">Janet Adebayo</option>
            <option value="Samuel Johnson">Samuel Johnson</option>
            <option value="Francis Doe">Francis Doe</option>
            <option value="Christian Dior">Christian Dior</option>
            <option value="Sarah Wilson">Sarah Wilson</option>
            <option value="Michael Brown">Michael Brown</option>
            <option value="Emily Davis">Emily Davis</option>
            <option value="David Miller">David Miller</option>
            <option value="Lisa Garcia">Lisa Garcia</option>
            <option value="James Taylor">James Taylor</option>
          </select>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        {/* Amount Section */}
        <div className="mb-6">
          <h3 className="text-[14px] font-medium text-[#45464e] mb-3">Amount</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[#8b8d97] mb-1">From</label>
              <input
                type="number"
                value={filters.amountFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, amountFrom: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#8b8d97] mb-1">To</label>
              <input
                type="number"
                value={filters.amountTo}
                onChange={(e) => setFilters(prev => ({ ...prev, amountTo: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          className="w-full bg-[#02016a] text-white py-3 rounded-lg font-medium text-[14px] hover:bg-[#03024a] transition-colors"
        >
          Filter
        </button>
      </div>
    </div>
  );
}
