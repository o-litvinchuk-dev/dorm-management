import rateLimit from "express-rate-limit";

const authRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000000, // 10 хвилин
    max: 1000, // Максимум 10 запитів
    message: "Забагато спроб входу. Спробуйте через 15 хвилин",
    keyGenerator: (req) => req.ip + req.body.email,
});

export default authRateLimiter; // Експортуємо як `default`
