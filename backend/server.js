// server.js
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import helmet from "helmet";
import rateLimiter from "./src/middlewares/rateLimiter.js";
import cors from "cors";
import authRoutes from "./src/routes/v1/authRoutes.js";
import secureRoutes from "./src/routes/v1/secureRoutes.js";
import adminRoutes from "./src/routes/v1/adminRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import servicesRoutes from "./src/routes/v1/servicesRoutes.js";
import { getEnforcer } from "./src/config/permissions.js";
import adminAccommodationRoutes from "./src/routes/v1/adminAccommodationRoutes.js";
import { authenticate } from "./src/middlewares/auth.js";
import facultyRoutes from "./src/routes/v1/facultyRoutes.js";
import facultyDormitoryRoutes from "./src/routes/v1/facultyDormitoryRoutes.js";
import userRoutes from "./src/routes/v1/userRoutes.js";
import adminDormitoryRoutes from "./src/routes/v1/adminDormitoryRoutes.js";
import roomRoutes from "./src/routes/v1/roomRoutes.js";
import groupRoutes from "./src/routes/v1/groupRoutes.js";
import dormitoryRoutes from "./src/routes/v1/dormitoryRoutes.js";
import dormitoryApplicationPresetRoutes from "./src/routes/v1/dormitoryApplicationPresetRoutes.js";
import dormManagerRoutes from "./src/routes/v1/dormManagerRoutes.js";
import adminSettlementContractRoutes from "./src/routes/v1/adminSettlementContractRoutes.js";
import dormitoryPassRoutes from "./src/routes/v1/dormitoryPassRoutes.js";
import settlementScheduleAdminRoutes from "./src/routes/v1/settlementScheduleAdminRoutes.js";
import publicRoutes from "./src/routes/v1/publicRoutes.js"; // Import new public routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

let enforcer;
(async () => {
  try {
    enforcer = await getEnforcer();
    console.log("[Casbin] Enforcer ініціалізовано");
  } catch (error) {
    console.error("[Casbin] Помилка ініціалізації:", error);
    process.exit(1);
  }
})();

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://dorm-life-frontend-nawz.vercel.app", // Ваш Vercel Frontend URL
      "https://dormlife-web.vercel.app", // Ваш Vercel Frontend URL
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Session-Id"], // Додано X-Session-Id
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(rateLimiter);

// app.use(updateSessionActivity); // Цей рядок має бути закоментований або відсутній

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/secure", secureRoutes);
app.use("/api/v1/admin", authenticate, adminRoutes);
app.use("/api/v1/faculties", facultyRoutes);
app.use("/api/v1/faculty-dormitories", facultyDormitoryRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/services", servicesRoutes);
app.use("/api/v1/admin/accommodation-applications", adminAccommodationRoutes);
app.use("/api/v1/admin/dormitories", adminDormitoryRoutes);
app.use("/api/v1/admin/settlement-agreements", adminSettlementContractRoutes);
app.use("/api/v1/dorm-manager", dormManagerRoutes);
app.use("/api/v1", roomRoutes);
app.use("/api/v1", groupRoutes);
app.use("/api/v1", dormitoryRoutes);
app.use("/api/v1/application-presets", dormitoryApplicationPresetRoutes);
app.use("/api/v1", dormitoryPassRoutes);
app.use("/api/v1/admin/settlement-schedule", settlementScheduleAdminRoutes);

app.use(errorHandler);

import "./src/config/redis.js"; // Переконайтеся, що Redis підключений

app.get("/", (req, res) => {
  res.send("Сервер працює!");
});

app.use(express.static(path.join(__dirname, "src")));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));