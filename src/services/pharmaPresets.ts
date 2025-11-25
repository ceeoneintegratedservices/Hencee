import { API_ENDPOINTS } from "@/config/api";
import { authFetch } from "./authFetch";

export interface PharmaPresets {
  unitTypes?: string[];
  paymentMethods?: string[];
  paymentStatuses?: string[];
  orderStatuses?: string[];
  discountDefaults?: {
    showDiscountOnInvoice?: boolean;
  };
}

export async function getPharmaPresets(): Promise<PharmaPresets> {
  try {
    const res = await authFetch(`${API_ENDPOINTS.pharmaPresets ?? `${API_ENDPOINTS.inventory}/presets`}`);
    if (!res.ok) {
      throw new Error("Failed to fetch pharma presets");
    }
    const data: any = await res.json();
    if (data && typeof data === "object" && "data" in data && data.data) {
      return data.data as PharmaPresets;
    }
    return (data as PharmaPresets) ?? {};
  } catch (error) {
    console.error("Error fetching pharma presets:", error);
    return {};
  }
}


