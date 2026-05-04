import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { quotesRouter } from "./routes/quotes";
import { materialsRouter } from "./routes/materials";
import { clientsRouter } from "./routes/clients";
import { dashboardRouter } from "./routes/dashboard";
import { jobsRouter } from "./routes/jobs";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/materials", materialsRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/jobs", jobsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend OFF24 in ascolto su http://localhost:${PORT}`);
});
