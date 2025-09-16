"use client";

import { useState } from "react";

interface FilterByDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (dateFilter: DateFilterData) => void;
}

interface DateFilterData {
  selectedRange: string;
  customFrom: string;
  customTo: string;
}

export default function FilterByDateModal({ isOpen, onClose, onApply }: FilterByDateModalProps) {
  const [dateFilter, setDateFilter] = useState<DateFilterData>({
    selectedRange: "",
    customFrom: "",
    customTo: ""
  });

  const predefinedRanges = [
    "This Week",
    "This Month", 
    "This Year",
    "Last Week",
    "Last Month",
    "Last Year"
  ];

  const handleRangeSelect = (range: string) => {
    setDateFilter(prev => ({
      ...prev,
      selectedRange: prev.selectedRange === range ? "" : range
    }));
  };

  const handleApply = () => {
    onApply(dateFilter);
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
      <div className="bg-white rounded-xl p-6 w-[400px] max-h-[400px] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[18px] font-semibold text-[#45464e]">By Date</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Predefined Ranges */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            {predefinedRanges.map((range) => (
              <label key={range} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dateFilter.selectedRange === range}
                  onChange={() => handleRangeSelect(range)}
                  className="w-4 h-4 text-[#02016a] border-gray-300 rounded focus:ring-[#02016a]"
                />
                <span className="text-[14px] text-[#45464e]">{range}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        {/* Custom Date Range */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={dateFilter.selectedRange === "Date Range"}
              onChange={() => handleRangeSelect("Date Range")}
              className="w-4 h-4 text-[#02016a] border-gray-300 rounded focus:ring-[#02016a]"
            />
            <span className="text-[14px] text-[#45464e]">Date Range</span>
          </label>

          {dateFilter.selectedRange === "Date Range" && (
            <div className="space-y-4">
              {/* Date Input Fields */}
              <div className="space-y-3">
                {/* From Date */}
                <div>
                  <label className="block text-[12px] text-[#8b8d97] mb-2">From</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFilter.customFrom}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, customFrom: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-[12px] text-[#8b8d97] mb-2">To</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dateFilter.customTo}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, customTo: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg text-[14px] text-[#45464e] focus:outline-none focus:ring-2 focus:ring-[#02016a] focus:border-transparent"
                    />
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Quick Date Buttons */}
              <div className="space-y-2">
                <div className="text-[12px] text-[#8b8d97] mb-2">Quick Select</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                      setDateFilter(prev => ({
                        ...prev,
                        customFrom: weekAgo.toISOString().split('T')[0],
                        customTo: today.toISOString().split('T')[0]
                      }));
                    }}
                    className="p-2 text-[12px] text-[#45464e] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                      setDateFilter(prev => ({
                        ...prev,
                        customFrom: monthAgo.toISOString().split('T')[0],
                        customTo: today.toISOString().split('T')[0]
                      }));
                    }}
                    className="p-2 text-[12px] text-[#45464e] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      setDateFilter(prev => ({
                        ...prev,
                        customFrom: startOfMonth.toISOString().split('T')[0],
                        customTo: today.toISOString().split('T')[0]
                      }));
                    }}
                    className="p-2 text-[12px] text-[#45464e] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const startOfYear = new Date(today.getFullYear(), 0, 1);
                      setDateFilter(prev => ({
                        ...prev,
                        customFrom: startOfYear.toISOString().split('T')[0],
                        customTo: today.toISOString().split('T')[0]
                      }));
                    }}
                    className="p-2 text-[12px] text-[#45464e] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    This Year
                  </button>
                </div>
              </div>
            </div>
          )}
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
