"use client";

import { useState, useEffect, useRef } from "react";

interface TimePeriodSelectorProps {
  selectedTimePeriod: "This Week" | "This Month";
  onTimePeriodChange: (period: "This Week" | "This Month") => void;
  className?: string;
  textColor?: string;
  iconColor?: string;
}

export default function TimePeriodSelector({
  selectedTimePeriod,
  onTimePeriodChange,
  className = "",
  textColor = "#8b8d97",
  iconColor = "#8B8D97"
}: TimePeriodSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTimePeriodChange = (period: "This Week" | "This Month") => {
    onTimePeriodChange(period);
    setShowDropdown(false);
  };

  const isSelected = selectedTimePeriod === "This Week" || selectedTimePeriod === "This Month";
  const currentTextColor = isSelected ? "#02016a" : textColor;
  const currentIconColor = isSelected ? "#02016a" : iconColor;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
      >
        <span 
          className={`text-xs ${isSelected ? "font-medium" : ""}`}
          style={{ color: currentTextColor }}
        >
          {selectedTimePeriod}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} 
          fill="none" 
          viewBox="0 0 10 6"
        >
          <path 
            d="M1 1L5 5L9 1" 
            stroke={currentIconColor} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      {showDropdown && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[120px]">
          <div 
            className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 ${
              selectedTimePeriod === "This Week" 
                ? "bg-[#f4f5fa] text-[#02016a] font-medium" 
                : "text-[#45464e]"
            }`}
            onClick={() => handleTimePeriodChange("This Week")}
          >
            This Week
          </div>
          <div 
            className={`px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 ${
              selectedTimePeriod === "This Month" 
                ? "bg-[#f4f5fa] text-[#02016a] font-medium" 
                : "text-[#45464e]"
            }`}
            onClick={() => handleTimePeriodChange("This Month")}
          >
            This Month
          </div>
        </div>
      )}
    </div>
  );
}
