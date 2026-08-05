import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? process.env.ComSpec || "cmd.exe" : "npm";
const npmArguments = isWindows
  ? ["/d", "/s", "/c", "npm run dev"]
  : ["run", "dev"];

const children = ["backend", "frontend"].map((name) => {
  const child = spawn(npmCommand, npmArguments, {
    cwd: resolve(rootDir, name),
    env: process.env,
    stdio: "inherit",
  });
  child.on("error", (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
  });
  return child;
});

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 200).unref();
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.error(`A development service exited (${signal || code}).`);
      shutdown(code || 1);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
