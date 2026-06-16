import cors from "cors";
import express from "express";
import { rateLimit } from "./middleware/rateLimit.js";
import { orbitalRouter } from "./routes/orbital.routes.js";
import { aiRoutes } from "./routes/ai.routes.js";
export const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit());
app.use("/api", orbitalRouter);
app.use("/api/ai", aiRoutes);
app.use((error, req, res, _next) => {
    const status = error.statusCode ?? (error.message.includes("not found") ? 404 : 500);
    console.error(`[SERVER ERROR] ${req.method} ${req.url} - Status: ${status}`, error);
    res.status(status).json({ error: error.message || "Internal server error" });
});
