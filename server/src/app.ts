import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { rateLimit } from "./middleware/rateLimit.js";
import { orbitalRouter } from "./routes/orbital.routes.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit());
app.use("/api", orbitalRouter);

app.use((error: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = error.statusCode ?? (error.message.includes("not found") ? 404 : 500);
  if (status >= 500) console.error("request.failed", error);
  res.status(status).json({ error: error.message || "Internal server error" });
});
