"use client";
import { useState } from "react";
import { API_ENDPOINTS } from "../../config/api";

export default function PasswordRecoveryPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(API_ENDPOINTS.passwordReset, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: input,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "It looks like there's no account associated with this email or whatsapp number. Please double-check for typos.");
        setSent(false);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setSent(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.passwordReset, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: input,
        }),
      });
      if (res.ok) {
        setSent(true);
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
        <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
        <p className="text-center mb-6 text-gray-600">Lets help you get back to your account!</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="input"
            type="text"
            placeholder="Enter your email/phone no"
            className="border rounded px-3 py-2"
            value={input}
            onChange={handleChange}
            required
          />
          <button
            type="submit"
            className="bg-blue-900 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Processing..." : "Reset Password"}
          </button>
        </form>
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}
        {sent && (
          <div className="mt-4 text-blue-900 text-center">
            We already sent a reset link to your email inbox.<br />
            If you didn't receive any email, check your spam folder or enter your email address above and click on the 'Resend reset link' button below.
            <button
              className="mt-4 w-full bg-blue-900 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? "Resending..." : "Resend reset link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 