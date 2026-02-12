"use client";

import { useState } from "react";
import { nigerianStates } from "@/data/nigerianStates";

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (customerData: CustomerData) => void;
}

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: string;
  password: string;
}

export default function CreateCustomerModal({ isOpen, onClose, onCreate }: CreateCustomerModalProps) {
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+234",
    address: "",
    city: "",
    state: "",
    country: "Nigeria",
    status: "Active",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreate = () => {
    onCreate(customerData);
    // Reset form
    setCustomerData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+234",
      address: "",
      city: "",
      state: "",
      country: "Nigeria",
      status: "Active",
      password: ""
    });
    setShowPassword(false);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-[20px] font-semibold text-[#45464e]">Add New Customer</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-red-500 hover:text-red-700" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-[14px] text-[#45464e] mb-2">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={customerData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-[14px] text-[#45464e] mb-2">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={customerData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[14px] text-[#45464e] mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[14px] text-[#45464e] mb-2">Phone Number</label>
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={customerData.countryCode}
                    onChange={(e) => handleInputChange('countryCode', e.target.value)}
                    className="block w-24 pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label className="block text-[14px] text-[#45464e] mb-2">
                Portal Password <span className="text-gray-400 text-xs">(optional - for customer portal access)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={customerData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password for customer portal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                If provided, the customer can use this password to log into the customer portal. Leave blank to require password reset.
              </p>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-[14px] text-[#45464e] mb-2">Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={customerData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter address"
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-[14px] text-[#45464e] mb-2">City</label>
              <input
                type="text"
                value={customerData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter city"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-[14px] text-[#45464e] mb-2">State</label>
              <div className="relative">
                <select
                  value={customerData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="block w-full pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select State</option>
                  {nigerianStates.map((s) => (
                    <option key={s.code} value={s.name}>{s.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-[14px] text-[#45464e] mb-2">Country</label>
              <div className="relative">
                <select
                  value={customerData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="block w-full pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="Kenya">Kenya</option>
                  <option value="South Africa">South Africa</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[14px] text-[#45464e] mb-2">Status</label>
              <div className="relative">
                <select
                  value={customerData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="block w-full pl-3 pr-8 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-[#02016a] text-[#02016a] rounded-lg font-medium text-[14px] hover:bg-[#f4f5fa] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-[#02016a] text-white rounded-lg font-medium text-[14px] hover:bg-[#03024a] transition-colors"
          >
            Create Customer
          </button>
        </div>
      </div>
    </div>
  );
}
