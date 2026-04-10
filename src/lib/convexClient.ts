import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";

export { api };

let client: ConvexReactClient | null = null;

export function registerConvexClient(c: ConvexReactClient | null) {
  client = c;
}

export function getConvexClient(): ConvexReactClient {
  if (!client) {
    throw new Error(
      "Convex is not initialized yet. Ensure ConvexClientRegistrar mounted inside ConvexProviderWithClerk."
    );
  }
  return client;
}
