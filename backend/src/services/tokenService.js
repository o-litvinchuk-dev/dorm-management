// src/services/tokenService.js
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const ACCESS_TOKEN_TTL_SECONDS = parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS) || 900; // 15 хвилин
const REFRESH_TOKEN_TTL_SECONDS = parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS) || 604800; // 7 днів

export const generateTokens = (user, sessionId, tokenVersion) => {
  const accessTokenPayload = {
    userId: user.id,
    role: user.role,
    sessionId: sessionId,
    tokenVersion: tokenVersion, // Додано tokenVersion в Access Token
  };

  const refreshTokenPayload = {
    userId: user.id,
    sessionId: sessionId,
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    process.env.JWT_SECRET,
    { expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s` }
  );

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    process.env.JWT_SECRET,
    { expiresIn: `${REFRESH_TOKEN_TTL_SECONDS}s` }
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresInSeconds: REFRESH_TOKEN_TTL_SECONDS,
    sessionId, // Повертаємо sessionId
  };
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.warn("[TokenService] JWT expired:", error.message);
    } else if (error.name === "JsonWebTokenError") {
      console.warn("[TokenService] JWT invalid:", error.message);
    } else {
      console.error("[TokenService] JWT verification error:", error);
    }
    throw error;
  }
};