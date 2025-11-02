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
  const [roleOptions, setRoleOptions] = useState<Array<{ id: string; name: string }>>([]);
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
            return { 
              id: String(r.id),  // Use the actual UUID from the API
              name: displayName  // Display name (roleType preferred, fallback to name)
            };
          }).filter((r: { id: string; name: string }) => !!r.id && !!r.name);
          
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
      const defaultRoles = [
        { id: 'MANAGER', name: 'Manager' },
        { id: 'ACCOUNTANT', name: 'Accountant' },
        { id: 'SALES_REP', name: 'Sales Representative' },
        { id: 'INVENTORY_CLERK', name: 'Inventory Clerk' },
        { id: 'ADMIN', name: 'Administrator' },
        { id: 'CASHIER', name: 'Cashier' },
        { id: 'AUDITOR', name: 'Auditor' }
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
      if (draftId) {
        await submitRegistrationDraft(draftId);
        localStorage.removeItem('registrationDraftId');
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          staffRole: form.staffRole,  // Now sends role UUID instead of role type
          password: form.password,
        };
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Registration payload:', payload);
          console.log('Selected role ID:', form.staffRole);
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
      }

      setSuccess("Account created! Please check your email to verify your account.");
      setTimeout(() => {
        try {
          router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
        } catch {
          setShowVerifyLink(true);
        }
      }, 1200);
      setShowVerifyLink(true);
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
                Didn't get redirected? <a href={`/verify-email?email=${encodeURIComponent(form.email)}`} className="text-blue-600 font-semibold">Click here to verify your email</a>
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