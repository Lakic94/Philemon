import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

/**
 * Create a Philemon auth client pointed at the central auth service.
 * Each app calls this with its own configured auth URL (e.g. import.meta.env.VITE_AUTH_URL).
 */
export function createPhilemonAuthClient(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [passkeyClient(), magicLinkClient()],
  });
}

export type PhilemonAuthClient = ReturnType<typeof createPhilemonAuthClient>;
