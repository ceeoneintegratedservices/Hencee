export function formatCurrencyNGN(input: string | number): string {
  if (typeof input === "string") {
    // Already formatted? Return as-is
    if (input.trim().startsWith("₦")) return input;
    const parsed = Number(input.replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(parsed)) return input;
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(parsed);
  }
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(input);
}

export function formatOrderDate(date: string | Date): string {
  // Returns: DD Mon YYYY - hh:mm am/pm
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year} - ${hours}:${minutes} ${ampm}`;
}

export function statusColorClass(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete")) return "bg-green-100 text-green-800 border-green-200";
  if (normalized.includes("pend")) return "bg-orange-100 text-orange-800 border-orange-200";
  if (normalized.includes("return")) return "bg-blue-100 text-blue-800 border-blue-200";
  if (normalized.includes("damage") || normalized.includes("cancel")) return "bg-red-100 text-red-800 border-red-200";
  if (normalized.includes("abandon")) return "bg-gray-100 text-gray-800 border-gray-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

export function parseTrackingId(id: string): string {
  return id?.trim() || "—";
}


