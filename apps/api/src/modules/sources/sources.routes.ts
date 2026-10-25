import { Router } from "express";
import { pool } from "../../infrastructure/db.js";
import type { Source } from "@nexus/types";

export const sourcesRouter = Router();

sourcesRouter.get("/", async (_req, res) => {
  const result = await pool.query<Source>("SELECT * FROM sources ORDER BY trust_score DESC");
  res.json(result.rows);
});
