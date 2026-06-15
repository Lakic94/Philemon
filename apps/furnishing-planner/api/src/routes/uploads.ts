import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { ah } from "../http.js";
import { presignUpload, publicUrl } from "../storage.js";

export const uploadsRouter = Router();

uploadsRouter.post(
  "/presign",
  ah(async (req, res) => {
    const body = z
      .object({ contentType: z.string().min(1), ext: z.string().max(8).optional() })
      .parse(req.body);
    const ext = (body.ext ?? body.contentType.split("/")[1] ?? "bin").replace(/[^a-z0-9]/gi, "");
    const key = `items/${randomUUID()}.${ext}`;
    const uploadUrl = await presignUpload(key, body.contentType);
    res.json({ key, uploadUrl, publicUrl: publicUrl(key) });
  }),
);
