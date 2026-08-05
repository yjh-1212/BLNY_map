import { createApp } from "./app.js";
import { config } from "./config.js";
import { openDatabase } from "./db/database.js";

const database = openDatabase(config.databasePath);
const app = createApp({ database });
const server = app.listen(config.port, config.host, () => {
  const displayHost = ["0.0.0.0", "::"].includes(config.host)
    ? "localhost"
    : config.host;
  console.log(`北粮南运 API 已启动：http://${displayHost}:${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
