import type { RequestHandler } from "express";

/** Wrap an async handler so rejections reach Express's error middleware (Express 4). */
export function ah(fn: RequestHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
