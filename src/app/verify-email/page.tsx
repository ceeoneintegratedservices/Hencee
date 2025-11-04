"use client";
import { useState, useEffect, Suspense } from "react";
import { API_ENDPOINTS } from "../../config/api";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");

  // Get email from URL query parameter if available
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(API_ENDPOINTS.verifyEmail, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Verification failed. Please try again.");
      } else {
        setSuccess("Email verified successfully! You can now log in.");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setResendLoading(true);
    setError("");
    setResendSuccess("");
    
    try {
      const res = await fetch(API_ENDPOINTS.resendVerification, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || "Failed to resend verification email. Please try again.");
      } else {
        setResendSuccess("Verification code sent! Please check your email.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">Verify Your Email</h2>
        <p className="text-center mb-6 text-gray-600">Enter the authentication code sent to your email.</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            className="border rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            name="code"
            type="text"
            placeholder="Enter authentication code"
            className="border rounded px-3 py-2"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>
        </form>
        
        {/* Resend Verification Button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resendLoading || !email}
            className="text-blue-600 hover:text-blue-800 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? "Sending..." : "Didn't receive the code? Resend"}
          </button>
        </div>
        
        {error && <div className="mt-4 text-red-600 text-center text-sm">{error}</div>}
        {success && <div className="mt-4 text-green-600 text-center text-sm">{success}</div>}
        {resendSuccess && <div className="mt-4 text-green-600 text-center text-sm">{resendSuccess}</div>}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f8]">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-center">Verify Your Email</h2>
          <p className="text-center mb-6 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
} 