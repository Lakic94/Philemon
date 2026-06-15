import type { NextFunction, Request, Response } from "express";
import { env } from "../env.js";

export interface AuthedUser {
  id: string;
  email: string;
  name?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

/**
 * Validate the Better Auth session by forwarding the request's cookies to the
 * central auth service. Cookies are domain-scoped (not port-scoped), so the
 * localhost auth cookie reaches this API too — that's our SSO bridge.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const r = await fetch(`${env.authUrl}/api/auth/get-session`, {
      headers: { cookie: req.headers.cookie ?? "" },
    });
    if (!r.ok) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const data = (await r.json()) as { user?: AuthedUser } | null;
    if (!data?.user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    req.user = data.user;
    next();
  } catch {
    res.status(401).json({ error: "auth check failed" });
  }
}
