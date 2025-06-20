"use client";
import { useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Placeholder for API call
    // 1. Check credentials
    // 2. If incorrect, setError("Password/email/whatsapp no does not match.")
    // 3. If correct, redirect or show success
    setTimeout(() => {
      if (form.identifier !== "user@example.com" || form.password !== "password123") {
        setError("Password/email/whatsapp no does not match.");
      } else {
        // Redirect or show success (not implemented)
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">Log in to your account</h2>
        <p className="text-center mb-6 text-gray-600">Welcome back! Please enter your details.</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="identifier"
            type="text"
            placeholder="Enter your email/phone no/staff Id"
            className="border rounded px-3 py-2"
            value={form.identifier}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="border rounded px-3 py-2"
            value={form.password}
            onChange={handleChange}
            required
          />
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-blue-600" /> Remember me
            </label>
            <a href="/password-recovery" className="text-blue-600 font-semibold">Forgot password</a>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <button className="w-full mt-4 flex items-center justify-center gap-2 border rounded px-4 py-2 bg-white hover:bg-gray-50">
          <img src="/icons/google.svg" alt="Google" className="w-5 h-5" /> Sign in with Google
        </button>
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        <div className="mt-4 text-center text-sm text-gray-600">
          Don't have an account? <a href="/signup" className="text-blue-600 font-semibold">Sign up</a>
        </div>
      </div>
    </div>
  );
} 