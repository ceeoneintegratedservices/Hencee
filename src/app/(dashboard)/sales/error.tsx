"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-[#6E7079] mb-4">{error?.message || "Failed to load sales dashboard."}</p>
        <button onClick={reset} className="px-4 py-2 rounded bg-[#02016a] text-white font-semibold">Try again</button>
      </div>
    </main>
  );
}


