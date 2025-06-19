"use client";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [form, setForm] = useState({
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    // Placeholder for API call
    setTimeout(() => {
      setSuccess("Password reset successful! You can now log in.");
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="password"
            type="password"
            placeholder="Enter your new password"
            className="border rounded px-3 py-2"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
          <input
            name="confirm"
            type="password"
            placeholder="Confirm your new password"
            className="border rounded px-3 py-2"
            value={form.confirm}
            onChange={handleChange}
            minLength={8}
            required
          />
          <button
            type="submit"
            className="bg-blue-900 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-center">{success}</div>}
      </div>
    </div>
  );
} 