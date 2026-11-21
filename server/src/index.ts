import "dotenv/config";

process.env.DB_ENGINE ??= "mongodb";
process.env.MODELDIR ??= "models";
process.env.PORT ??= "4000";
process.env.ENABLE_WEBSOCKET = "false";
process.env.ENABLE_OTP ??= "false";
if (!process.env.DB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Configure DB_URI and a JWT_SECRET of at least 32 characters.");
}
if (!process.env.INITIAL_ADMIN_USER || !process.env.INITIAL_ADMIN_PASS) {
  throw new Error("Configure INITIAL_ADMIN_USER and INITIAL_ADMIN_PASS.");
}
if (process.env.NODE_ENV === "production" && new URL(process.env.DB_URI).pathname !== "/ellma") {
  throw new Error("Production must use the ellma logical database on shared-mongo.");
}

const express = (await import("express")).default;
const { Yappio } = await import("yappio");
const { installBoundaryFirst } = await import("./platform/boundary.js");
const { requireAccount } = await import("./platform/access.js");
const { goalRoutes } = await import("./goals/goal.routes.js");
const { taskRoutes } = await import("./tasks/task.routes.js");
const { focusRoutes } = await import("./focus/focus.routes.js");
const { assistantRoutes } = await import("./assistant/assistant.routes.js");
const { accountPublicRoutes, accountRoutes } = await import("./account/account.routes.js");
const { adminRoutes } = await import("./admin/admin.routes.js");

const app = new Yappio({
  platform: {
    enabled: true,
    appId: "ellma",
    appName: "ellma",
    version: "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
    authAdmin: {
      enabled: true,
      rootAccessSupported: true,
      rootAccessEnabled: true,
      rootResetSupported: false,
      rootResetEnabled: false,
    },
  },
});

app.use((server) => {
  installBoundaryFirst(
    server,
    (process.env.ALLOWED_ORIGINS ?? "https://ellma.yappai.de")
      .split(",")
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean),
  );
  // Signing in and password recovery work without a session, so they mount first.
  server.use("/api/ellma/account", express.json({ limit: "8kb" }), accountPublicRoutes);
  const api = express.Router();
  api.use(express.json({ limit: "64kb" }), requireAccount());
  api.use("/account", accountRoutes);
  api.use("/admin", requireAccount(true), adminRoutes);
  api.use("/goals", goalRoutes);
  api.use("/tasks", taskRoutes);
  api.use("/focus", focusRoutes);
  api.use("/assistant", assistantRoutes);
  server.use("/api/ellma", api);
});

await app.start();
console.log("Ellma is running with Yappio.");
