"use client";

import { useEffect, useRef, useState } from "react";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import { useRouter } from "next/navigation";
import {
  createRegistrationDraft,
  getRegistrationDraft,
  getRegistrationDraftByEmail,
  saveRegistrationDraft,
  submitRegistrationDraft,
} from "@/services/authDrafts";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    staffRole: "",
    password: "",
    confirmPassword: "",
  });
  const [roleOptions, setRoleOptions] = useState<Array<{ id: string; name: string; roleType: string }>>([]);
  const [rolesLoading, setRolesLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVerifyLink, setShowVerifyLink] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [continueEmail, setContinueEmail] = useState("");
  const [continueLoading, setContinueLoading] = useState(false);
  const [continueError, setContinueError] = useState("");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  // Load existing draft on mount from localStorage
  useEffect(() => {
    const existingId = typeof window !== 'undefined' ? localStorage.getItem('registrationDraftId') : null;
    if (!existingId) return;
    setDraftId(existingId);
    (async () => {
      try {
        const draft = await getRegistrationDraft(existingId);
        if (draft?.data) setForm((prev) => ({ ...prev, ...draft.data }));
      } catch {}
    })();
  }, []);


  // Map display names to backend role types
  const mapRoleNameToBackendType = (displayName: string): string => {
    const name = displayName.toLowerCase().trim();
    
    // Map common display names to backend role types
    const roleMap: Record<string, string> = {
      'sales representative': 'sales_representative',
      'sales rep': 'sales_representative',
      'sales_rep': 'sales_representative',
      'manager': 'general_manager',
      'general manager': 'general_manager',
      'accountant': 'accountant',
      'auditor': 'auditor',
      'inventory clerk': 'book_storekeeper',
      'book storekeeper': 'book_storekeeper',
      'storekeeper': 'book_storekeeper',
      'it support': 'technical_support',
      'technical support': 'technical_support',
      'tech support': 'technical_support',
      'support': 'technical_support',
      'human resources': 'human_resources',
      'hr': 'human_resources',
      'managing director': 'managing_director',
      'cashier': 'cashier',
      'admin': 'admin',
      'administrator': 'admin',
    };
    
    // Check exact match first
    if (roleMap[name]) {
      return roleMap[name];
    }
    
    // Check partial matches
    for (const [key, value] of Object.entries(roleMap)) {
      if (name.includes(key) || key.includes(name)) {
        return value;
      }
    }
    
    // If no match, try to normalize the name (replace spaces with underscores, lowercase)
    const normalized = name.replace(/\s+/g, '_');
    return normalized;
  };

  // Fetch roles for dropdown or use default roles if API fails
  useEffect(() => {
    (async () => {
      setRolesLoading(true);
      try {
        // Try to fetch roles from API without authentication
        const response = await fetch(`${API_BASE_URL}/roles`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const apiRoles = Array.isArray(data) ? data : (data?.roles || []);
          const mapped = (apiRoles || []).map((r: any) => {
            // Use the UUID id from the API, and roleType or name for display
            const displayName = r?.roleType || r?.name || 'Unknown Role';
            // Map display name to backend role type
            const roleType = mapRoleNameToBackendType(displayName);
            return { 
              id: String(r.id),  // Use the actual UUID from the API (for selection)
              name: displayName,  // Display name (roleType preferred, fallback to name)
              roleType: roleType  // Backend role name to send in registration
            };
          }).filter((r: { id: string; name: string; roleType: string }) => {
            // Filter out admin roles
            const roleName = r.name?.toLowerCase() || '';
            const roleId = r.id?.toLowerCase() || '';
            return !!r.id && !!r.name && 
                   !roleName.includes('admin') && 
                   !roleId.includes('admin');
          });
          
          if (mapped.length > 0) {
            setRoleOptions(mapped);
            // If no role preselected, default to first
            if (!form.staffRole && mapped[0]) {
              setForm(prev => ({ ...prev, staffRole: mapped[0].id }));
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.log('Loaded roles from API:', mapped.length);
              console.log('Roles:', mapped);
            }
            
            setRolesLoading(false);
            return;
          }
        }
      } catch (error) {
        console.log('Could not fetch roles from API, using defaults');
      }
      
      // Fallback to default roles if API fails or returns empty
      // Admin role is excluded - should only be created by existing admins
      // Map display names to backend role names
      const defaultRoles = [
        { id: 'MANAGER', name: 'Manager', roleType: 'general_manager' },
        { id: 'ACCOUNTANT', name: 'Accountant', roleType: 'accountant' },
        { id: 'SALES_REP', name: 'Sales Representative', roleType: 'sales_representative' },
        { id: 'INVENTORY_CLERK', name: 'Inventory Clerk', roleType: 'book_storekeeper' },
        { id: 'IT_SUPPORT', name: 'IT Support', roleType: 'technical_support' },
        { id: 'HR', name: 'Human Resources', roleType: 'human_resources' },
        { id: 'MANAGING_DIRECTOR', name: 'Managing Director', roleType: 'managing_director' },
        { id: 'CASHIER', name: 'Cashier', roleType: 'cashier' },
        { id: 'AUDITOR', name: 'Auditor', roleType: 'auditor' }
      ];
      
      setRoleOptions(defaultRoles);
      // If no role preselected, default to first
      if (!form.staffRole) {
        setForm(prev => ({ ...prev, staffRole: defaultRoles[0].id }));
      }
      setRolesLoading(false);
    })();
  }, []);

  // Debounced autosave whenever form changes
  useEffect(() => {
    if (!form.email) return; // require email as key
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        if (!draftId) {
          const created = await createRegistrationDraft(form.email, form, 1);
          setDraftId(created.id);
          localStorage.setItem('registrationDraftId', created.id);
        } else {
          await saveRegistrationDraft(draftId, form.email, form, 1);
        }
      } catch {}
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [form, draftId]);

  const handleSaveDraftNow = async () => {
    try {
      if (!form.email) return;
      if (!draftId) {
        const created = await createRegistrationDraft(form.email, form, 1);
        setDraftId(created.id);
        localStorage.setItem('registrationDraftId', created.id);
      } else {
        await saveRegistrationDraft(draftId, form.email, form, 1);
      }
      setSuccess('Draft saved. You can continue later.');
    } catch {
      setError('Failed to save draft. Please try again.');
    }
  };

  const handleContinueRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setContinueLoading(true);
    setContinueError("");
    
    try {
      const draft = await getRegistrationDraftByEmail(continueEmail);
      
      if (draft && !draft.isSubmitted) {
        // Draft found - load it
        setDraftId(draft.id);
        localStorage.setItem('registrationDraftId', draft.id);
        if (draft.data) {
          setForm((prev) => ({ ...prev, ...draft.data }));
        }
        setShowContinueModal(false);
        setContinueEmail("");
        setSuccess('Draft loaded! Continue where you left off.');
      } else {
        setContinueError('No draft found for this email address.');
      }
    } catch (err) {
      setContinueError('Failed to fetch draft. Please try again.');
    } finally {
      setContinueLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate password match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setShowVerifyLink(false);
    try {
      // Find the role name from the selected role ID
      const selectedRole = roleOptions.find(r => r.id === form.staffRole);
      let roleName = selectedRole?.roleType || selectedRole?.name || form.staffRole;
      
      // Double-check: if roleName looks like a display name, map it to backend type
      // This ensures we always send the correct backend role name
      if (roleName && !roleName.includes('_')) {
        // Likely a display name (has spaces or is camelCase), map it
        roleName = mapRoleNameToBackendType(roleName);
      }
      
      // Always use the regular register endpoint
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        staffRole: roleName,  // Send role name (roleType) instead of UUID
        password: form.password,
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Registration payload:', payload);
        console.log('Selected role ID:', form.staffRole);
        console.log('Selected role object:', selectedRole);
        console.log('Final mapped role name:', roleName);
      }
      
      const res = await fetch(API_ENDPOINTS.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed.");
        setLoading(false);
        return;
      }
      
      // If there was a draft, clean it up after successful registration
      if (draftId) {
        try {
          localStorage.removeItem('registrationDraftId');
          // Optionally delete the draft from backend (but not critical)
          // The draft will be cleaned up by backend eventually
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Check approval status in response
      const approvalStatus = data.user?.approvalStatus || data.approvalStatus || 'pending';
      
      let successMessage = "Account created! Please check your email to verify your account before logging in.";
      if (approvalStatus === 'pending') {
        successMessage += " Your account is pending approval from an administrator. You will receive a notification once your account has been approved.";
      } else if (approvalStatus === 'approved') {
        successMessage += " Your account has been approved.";
      }

      setSuccess(successMessage);
      setShowVerifyLink(true);
      // Don't auto-redirect - let user read the message and click to verify when ready
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">Create an account</h2>
        <p className="text-center mb-4 text-gray-600">Welcome! Select a method to Start:</p>
        
        {/* Continue Registration Button */}
        <button
          type="button"
          onClick={() => setShowContinueModal(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 rounded px-4 py-2 bg-white hover:bg-blue-50 font-semibold"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Continue Registration
        </button>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="name"
            type="text"
            placeholder="Enter your name"
            className="border rounded px-3 py-2"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            className="border rounded px-3 py-2"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            type="tel"
            placeholder="Enter your phone number"
            className="border rounded px-3 py-2"
            value={form.phone}
            onChange={handleChange}
          />
          <select
            name="staffRole"
            className="border rounded px-3 py-2"
            value={form.staffRole}
            onChange={handleChange}
            required
          >
            <option value="">{rolesLoading ? 'Loading roles...' : 'Select role of staff'}</option>
            {roleOptions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <input
            name="password"
            type="password"
            placeholder="Create a password"
            className="border rounded px-3 py-2"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            className="border rounded px-3 py-2"
            value={form.confirmPassword}
            onChange={handleChange}
            minLength={8}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
          </button>
          <button
            type="button"
            onClick={handleSaveDraftNow}
            className="border rounded px-4 py-2 font-semibold"
          >
            Save as draft
          </button>
        </form>
        <button className="w-full mt-4 flex items-center justify-center gap-2 border rounded px-4 py-2 bg-white hover:bg-gray-50">
          <img src="/icons/google.svg" alt="Google" className="w-5 h-5" /> Sign up with Google
        </button>
        
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        {success && (
          <div className="mt-4 text-green-600 text-center">
            {success}
            {showVerifyLink && (
              <div className="mt-2">
                <a href={`/verify-email?email=${encodeURIComponent(form.email)}`} className="text-blue-600 font-semibold underline">Click here to verify your email</a>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-blue-600 font-semibold">Log in</a>
        </div>
      </div>

      {/* Continue Registration Modal */}
      {showContinueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Continue Registration</h3>
              <button
                onClick={() => {
                  setShowContinueModal(false);
                  setContinueEmail("");
                  setContinueError("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Enter the email address you used to start your registration. We'll fetch your saved progress.
            </p>
            
            <form onSubmit={handleContinueRegistration}>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border rounded px-3 py-2 mb-4"
                value={continueEmail}
                onChange={(e) => setContinueEmail(e.target.value)}
                required
              />
              
              {continueError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {continueError}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={continueLoading}
                  className="flex-1 bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {continueLoading ? 'Loading...' : 'Fetch Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowContinueModal(false);
                    setContinueEmail("");
                    setContinueError("");
                  }}
                  className="flex-1 border border-gray-300 text-gray-700 rounded px-4 py-2 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 