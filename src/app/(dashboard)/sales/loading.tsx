export default function Loading() {
  return (
    <main className="min-h-screen bg-[#f7f7f8] px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl shadow p-4 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-xl shadow p-4 animate-pulse h-96" />
      </div>
    </main>
  );
}


