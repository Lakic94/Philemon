import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import pg from "pg";
import { env } from "./env.js";

const pool = new pg.Pool({ connectionString: env.databaseUrl });

export const auth = betterAuth({
  database: pool,
  secret: env.authSecret,
  baseURL: env.authUrl,
  trustedOrigins: [env.webOrigin],
  // Passwordless only — magic-link creates accounts; passkeys are the daily driver.
  emailAndPassword: { enabled: false },
  plugins: [
    passkey({
      rpID: env.rpId,
      rpName: env.rpName,
      origin: env.webOrigin,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Local dev: print to console. Real email at the Hetzner phase.
        console.log("\n────────────────────────────────────────");
        console.log(`  MAGIC LINK for ${email}`);
        console.log(`  ${url}`);
        console.log("────────────────────────────────────────\n");
      },
    }),
  ],
});

export type Auth = typeof auth;
