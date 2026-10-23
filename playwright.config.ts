import { defineConfig, devices } from "@playwright/test";

// Run against a migrated, dedicated test database. No remote services are used.
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to a dedicated migrated test database");
if (!process.env.OPERATOR_SECRET) throw new Error("Set a test-only OPERATOR_SECRET (32+ characters)");
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:43100", ...devices["Desktop Chrome"] },
  webServer: [
    {
      command: "npm start -w backend",
      url: "http://127.0.0.1:43101",
      env: { PORT: "43101", HOST: "127.0.0.1", FRONTEND_URL: "http://127.0.0.1:43100", NODE_ENV: "test" },
      reuseExistingServer: false,
    },
    {
      command: "npm start -w frontend -- --hostname 127.0.0.1 --port 43100",
      url: "http://127.0.0.1:43100",
      reuseExistingServer: false,
    },
  ],
});
