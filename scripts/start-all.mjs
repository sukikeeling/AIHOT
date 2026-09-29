// scripts/start-all.mjs
// All-in-one runner for Railway / single-container Docker deployments.
// Automatically handles migrations, seeds, API, Worker, and Web SSR.

import { spawn } from "node:child_process";
import crypto from "node:crypto";

console.log("==================================================");
console.log("🚀 Starting AIHOT All-In-One Container Engine...");
console.log("==================================================");

// 1. Environment & Secrets auto-configuration
if (process.env.RAILWAY_PUBLIC_DOMAIN && !process.env.SITE_URL) {
  process.env.SITE_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  console.log(`[AIHOT] Auto-configured SITE_URL: ${process.env.SITE_URL}`);
}

if (!process.env.SITE_URL) {
  process.env.SITE_URL = "http://localhost:" + (process.env.PORT || "3000");
}

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 8) {
  process.env.SESSION_SECRET = crypto.randomBytes(32).toString("hex");
  console.log("[AIHOT] Auto-generated random SESSION_SECRET");
}

if (!process.env.IMG_PROXY_SIGN_SECRET || process.env.IMG_PROXY_SIGN_SECRET.length < 8) {
  process.env.IMG_PROXY_SIGN_SECRET = crypto.randomBytes(32).toString("hex");
  console.log("[AIHOT] Auto-generated random IMG_PROXY_SIGN_SECRET");
}

if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) {
  const generatedPwd = "AningMaster@" + crypto.randomBytes(6).toString("hex");
  process.env.ADMIN_PASSWORD = generatedPwd;
  console.log("");
  console.log("🔑 ==================================================");
  console.log("🔑 [AIHOT] ADMIN_PASSWORD was not provided.");
  console.log(`🔑 [AIHOT] Generated temporary password: ${generatedPwd}`);
  console.log("🔑 [AIHOT] Use this password to sign in at /admin !");
  console.log("🔑 ==================================================");
  console.log("");
}

process.env.WEB_HOST = process.env.WEB_HOST || "0.0.0.0";
process.env.API_HOST = process.env.API_HOST || "127.0.0.1";
process.env.API_PORT = process.env.API_PORT || "3001";
process.env.API_BASE_URL = process.env.API_BASE_URL || `http://127.0.0.1:${process.env.API_PORT}`;
process.env.TRUST_PROXY = process.env.TRUST_PROXY || "true";

// Helper to run a command and wait for exit
function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", env: process.env });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command '${cmd} ${args.join(" ")}' failed with exit code ${code}`));
    });
    child.on("error", reject);
  });
}

// 2. Wait for database and execute migrations
console.log("[AIHOT] Waiting for PostgreSQL database connection...");
const maxRetries = 30;
let dbReady = false;

for (let i = 1; i <= maxRetries; i++) {
  try {
    await runCommand("node", ["scripts/migrate.ts"]);
    dbReady = true;
    console.log("[AIHOT] ✅ Migrations completed successfully!");
    break;
  } catch (err) {
    console.log(`[AIHOT] Database not ready yet (attempt ${i}/${maxRetries}), retrying in 2s...`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

if (!dbReady) {
  console.error("[AIHOT] ❌ Failed to connect to database after multiple attempts.");
  process.exit(1);
}

// 3. Run database seed (topics, demo sources)
try {
  console.log("[AIHOT] Running database seed...");
  await runCommand("node", ["scripts/seed.ts"]);
  console.log("[AIHOT] ✅ Database seed completed.");
} catch (err) {
  console.warn("[AIHOT] ⚠️ Seed warning:", err.message);
}

// 4. Start API process
console.log(`[AIHOT] Starting API process on port ${process.env.API_PORT}...`);
const apiProc = spawn("node", ["apps/api/src/main.ts"], {
  stdio: "inherit",
  env: process.env,
});

// Wait briefly for API to bind port
await new Promise((r) => setTimeout(r, 1500));

// 5. Start Worker process
console.log("[AIHOT] Starting background Worker process (queues & schedules)...");
const workerProc = spawn("node", ["apps/worker/src/main.ts"], {
  stdio: "inherit",
  env: process.env,
});

// 6. Start Web SSR process
const webPort = process.env.PORT || process.env.WEB_PORT || "3000";
console.log(`[AIHOT] Starting Web SSR process on port ${webPort}...`);
const webProc = spawn("node", ["apps/web/server.ts"], {
  stdio: "inherit",
  env: { ...process.env, WEB_PORT: webPort, PORT: webPort },
});

// 7. Process management and graceful shutdown
const children = [apiProc, workerProc, webProc];
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[AIHOT] Received ${signal}. Gracefully stopping all child processes...`);
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill(signal);
      } catch (e) {}
    }
  }
  setTimeout(() => process.exit(0), 3000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

webProc.on("close", (code) => {
  console.log(`[AIHOT] Web process exited with code ${code}`);
  shutdown("SIGTERM");
});
