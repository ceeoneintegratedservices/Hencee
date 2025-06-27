"use client";
import { useState } from "react";
import { API_ENDPOINTS } from "../../config/api";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    staffRole: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showVerifyLink, setShowVerifyLink] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
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
      const res = await fetch(API_ENDPOINTS.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          staffRole: form.staffRole,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed.");
      } else {
        setSuccess("Account created! Please check your email to verify your account.");
        // Try to redirect to verify-email page after a short delay
        setTimeout(() => {
          try {
            router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
          } catch {
            setShowVerifyLink(true);
          }
        }, 1200);
        // Also show the link in case redirect fails
        setShowVerifyLink(true);
      }
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
        <p className="text-center mb-6 text-gray-600">Welcome! Select a method to Start:</p>
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
            <option value="">Select role of staff</option>
            <option value="managing_director">Managing Director</option>
            <option value="sales_representative">Sales Representative</option>
            <option value="general_manager">General Manager</option>
            <option value="book_storekeeper">Book/storekeeper</option>
            <option value="technical_support">Technical Support</option>
            <option value="auditor">Auditor</option>
            <option value="human_resources">Human Resources</option>
            <option value="accountant">Accountant</option>
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
    </div>
  );
} 