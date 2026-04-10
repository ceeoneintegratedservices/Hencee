import { getConvexClient, api } from "@/lib/convexClient";

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
    const data = await getConvexClient().query(api.pharmaPresets.get, {});
    if (data && typeof data === "object") {
      return data as PharmaPresets;
    }
    return {};
  } catch (error) {
    console.error("Error fetching pharma presets:", error);
    return {};
  }
}
