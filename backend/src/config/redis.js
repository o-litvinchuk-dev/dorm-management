import { createClient } from "redis";

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: process.env.REDIS_PORT || 6379,
    },
    password: process.env.REDIS_PASSWORD || "", // Додано пароль
});

redisClient.on("connect", () => {
    console.log("[Redis] Підключено до Redis");
});

redisClient.on("error", (err) => {
    console.error("[Redis] Помилка підключення до Redis:", err);
});

await redisClient.connect();
console.log("Redis connected");

export default redisClient;
