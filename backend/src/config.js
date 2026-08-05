import { fileURLToPath } from "node:url";

function parseOrigins(value) {
  return (value || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseBoolean(value, defaultValue) {
  if (value === undefined || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const config = Object.freeze({
  host: process.env.HOST || "0.0.0.0",
  port: Number.parseInt(process.env.PORT || "8080", 10),
  allowedOrigins: parseOrigins(process.env.FRONTEND_ORIGIN),
  serviceName: "beiliang-nanyun-api",
  databasePath:
    process.env.DATABASE_PATH ||
    fileURLToPath(new URL("../data/beiliang-nanyun.db", import.meta.url)),
  frontendDistPath: fileURLToPath(
    new URL("../../frontend/dist", import.meta.url),
  ),
  databaseAdminEnabled: parseBoolean(
    process.env.ENABLE_DATABASE_ADMIN,
    process.env.NODE_ENV !== "production",
  ),
});
