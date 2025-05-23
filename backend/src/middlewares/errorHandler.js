// backend/src/middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error("[ErrorHandler] Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === "development" ? err.message : "Помилка сервера",
  });
};