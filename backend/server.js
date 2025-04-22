import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import helmet from "helmet";
import rateLimiter from "./src/middlewares/rateLimiter.js";
import cors from "cors";
import authRoutes from "./src/routes/v1/authRoutes.js";
import { secureRoutes } from "./src/routes/v1/secureRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import servicesRoutes from "./src/routes/v1/servicesRoutes.js";

const app = express();
const server = createServer(app);

// Налаштування CORS
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "https://accounts.google.com",
      "https://*.googleapis.com"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
  })
);

// Базові middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(rateLimiter);

// Логування запитів
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Обмеження запитів
app.use(rateLimiter);

// Підключення маршрутів
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/secure", secureRoutes);
app.use("/api/v1/services", servicesRoutes);

// Обробка помилок
app.use(errorHandler);

// Підключення Redis
import "./src/config/redis.js";

// Тестовий маршрут
app.get("/", (req, res) => {
  res.send("Сервер працює!");
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "src")));

// Запуск сервера
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));