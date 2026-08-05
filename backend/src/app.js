import { existsSync } from "node:fs";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { modules } from "./data/modules.js";
import { openDatabase } from "./db/database.js";
import { createDatabaseAdminRouter } from "./routes/database-admin.js";
import { createBusinessRouter, createWorkflowRouter } from "./routes/business.js";

export function createApp(options = {}) {
  const app = express();
  const database = options.database || openDatabase(":memory:");
  const databaseAdminEnabled =
    options.databaseAdminEnabled ?? config.databaseAdminEnabled;

  app.locals.database = database;

  app.disable("x-powered-by");
  app.use((request, response, next) => {
    response.set({
      "Referrer-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    });
    next();
  });
  app.use(
    cors((request, callback) => {
      const origin = request.get("origin");
      let sameOrigin = false;
      try {
        sameOrigin = Boolean(origin) && new URL(origin).host === request.get("host");
      } catch {
        sameOrigin = false;
      }
      if (!origin || sameOrigin || config.allowedOrigins.includes(origin)) {
        callback(null, { origin: Boolean(origin) });
        return;
      }
      callback(new Error("Origin is not allowed by CORS"));
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_request, response) => {
    response.set("Cache-Control", "no-store").json({
      status: "ok",
      service: config.serviceName,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/v1/modules", (_request, response) => {
    response.json({ items: modules, total: modules.length });
  });

  app.get("/api/v1/platform", (_request, response) => {
    response.json({
      name: "北粮南运数字化协同平台",
      englishName: "NORTH–SOUTH GRAIN CORRIDOR",
      apiVersion: "v1",
    });
  });

  app.use(
    "/api/v1/admin/database",
    createDatabaseAdminRouter({ database, enabled: databaseAdminEnabled }),
  );
  app.use('/api/v1/business',createBusinessRouter({database}));
  app.use('/api/v1/workflow',createWorkflowRouter({database}));

  if (existsSync(config.frontendDistPath)) {
    app.use(express.static(config.frontendDistPath));
    app.get(/^(?!\/api(?:\/|$)).*/, (_request, response, next) => {
      response.sendFile(
        "index.html",
        { root: config.frontendDistPath },
        (error) => (error ? next(error) : undefined),
      );
    });
  }

  app.use((request, response) => {
    response.status(404).json({
      error: "Not Found",
      message: `No API route matches ${request.method} ${request.originalUrl}`,
    });
  });

  app.use((error, _request, response, _next) => {
    const corsError = error?.message === "Origin is not allowed by CORS";
    const databaseError = error?.code?.startsWith("ERR_SQLITE");
    response.status(corsError ? 403 : databaseError ? 400 : 500).json({
      error: corsError ? "Forbidden" : databaseError ? "Database Error" : "Internal Server Error",
      message:
        corsError || databaseError
          ? error.message
          : "The server could not process this request.",
    });
  });

  return app;
}
