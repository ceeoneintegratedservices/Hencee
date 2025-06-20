"use client";
import { useState } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
    staffRole: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    // Placeholder for API call
    // 1. Check if email/phone exists
    // 2. If exists, setError("Email or phone number already exists.")
    // 3. Else, create user, send verification email, setSuccess("Account created! Please check your email to verify your account.")
    setTimeout(() => {
      if (form.email === "test@exists.com" || form.phone === "1234567890") {
        setError("Email or phone number already exists.");
      } else {
        console.log("New User Data:", form);
        setSuccess("Account created! Please check your email to verify your account.");
      }
      setLoading(false);
    }, 1200);
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
            required
          />
          <select
            name="userType"
            className="border rounded px-3 py-2"
            value={form.userType}
            onChange={handleChange}
            required
          >
            <option value="">Select user type</option>
            <option value="staff">Staff</option>
          </select>
          {form.userType === "staff" && (
            <select
                name="staffRole"
                className="border rounded px-3 py-2"
                value={form.staffRole}
                onChange={handleChange}
                required
            >
                <option value="">Select role of staff</option>
                <option value="sales_representative">Sales Representative</option>
                <option value="general_manager">General Manager</option>
                <option value="book_storekeeper">Book/storekeeper</option>
                <option value="technical_support">Technical Support</option>
                <option value="auditor">Auditor</option>
                <option value="human_resources">Human Resources</option>
                <option value="accountant">Accountant</option>
            </select>
          )}
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
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating..." : "Get started"}
          </button>
        </form>
        <button className="w-full mt-4 flex items-center justify-center gap-2 border rounded px-4 py-2 bg-white hover:bg-gray-50">
          <img src="/icons/google.svg" alt="Google" className="w-5 h-5" /> Sign up with Google
        </button>
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-center">{success}</div>}
        <div className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-blue-600 font-semibold">Log in</a>
        </div>
      </div>
    </div>
  );
} 