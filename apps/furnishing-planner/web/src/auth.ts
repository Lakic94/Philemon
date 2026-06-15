import { createPhilemonAuthClient } from "@philemon/auth-client";

export const authClient = createPhilemonAuthClient(import.meta.env.VITE_AUTH_URL);
export const { useSession, signIn, signOut, passkey } = authClient;
