import { test, expect, Page, WebSocketRoute } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const composer = (page: Page) => page.getByPlaceholder("Type a message");
async function send(page: Page, content: string) {
  await expect(composer(page)).toBeEnabled();
  await expect(composer(page)).toBeEditable();
  await composer(page).fill(content);
  await composer(page).press("Enter");
  await expect(composer(page)).toHaveValue("");
  await expect(composer(page)).toBeFocused();
}
async function loginOperator(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Operator secret").fill(process.env.OPERATOR_SECRET!);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByLabel("Operator secret")).toHaveCount(0);
  await expect(page.locator("h2", { hasText: "Conversations" }).locator("visible=true")).toBeVisible();
}

test("H3: ordered two-way display and reconnect without page reload", async ({ browser }) => {
  const visitorContext = await browser.newContext({ baseURL: "http://127.0.0.1:43100" });
  const operatorContext = await browser.newContext({ baseURL: "http://127.0.0.1:43100" });
  const visitor = await visitorContext.newPage();
  const operator = await operatorContext.newPage();
  let token: string | null = null;
  try {
    let interrupted = false;
    let transport: WebSocketRoute | undefined;
    await visitorContext.routeWebSocket("ws://127.0.0.1:43101/**", (route) => {
      if (interrupted) { void route.close(); return; }
      transport = route;
      route.connectToServer();
    });
    await visitor.goto("/visitor");
    await expect.poll(() => visitor.evaluate(() => localStorage.getItem("chat-token"))).toBeTruthy();
    token = await visitor.evaluate(() => localStorage.getItem("chat-token"));
    await visitor.getByRole("button", { name: "Open chat" }).click();
    await expect(composer(visitor)).toBeEnabled();
    await loginOperator(operator);
    let visitorLoads = 0, operatorLoads = 0;
    visitor.on("load", () => visitorLoads++);
    operator.on("load", () => operatorLoads++);
    await send(visitor, "H3 first");
    await operator.getByText("H3 first", { exact: true }).click();
    await expect(composer(operator)).toBeEnabled();
    await send(operator, "H3 second");
    await expect(visitor.getByText("H3 second", { exact: true })).toBeVisible();
    await send(visitor, "H3 third");
    await expect(operator.getByText("H3 third", { exact: true }).last()).toBeVisible();
    for (const page of [visitor, operator]) {
      await expect(page.getByTestId("message-content")).toHaveText(["H3 first", "H3 second", "H3 third"]);
    }
    await expect.poll(() => Boolean(transport)).toBe(true);
    interrupted = true;
    await transport!.close({ code: 1012, reason: "E2E transport interruption" });
    await expect(composer(visitor)).toBeDisabled();
    interrupted = false;
    await expect(composer(visitor)).toBeEnabled({ timeout: 20000 });
    await expect(visitor.getByText("H3 first", { exact: true })).toHaveCount(1);
    await send(operator, "H3 after reconnect");
    await expect(visitor.getByText("H3 after reconnect", { exact: true })).toBeVisible();
    await send(visitor, "H3 reconnect reply");
    await expect(operator.getByText("H3 reconnect reply", { exact: true }).last()).toBeVisible();
    expect(visitorLoads).toBe(0);
    expect(operatorLoads).toBe(0);
  } finally {
    await visitorContext.close();
    await operatorContext.close();
    if (token) {
      const db = new PrismaClient();
      try {
        await db.conversation.deleteMany({ where: { tokenHash: createHash("sha256").update(token).digest("hex") } });
      } finally { await db.$disconnect(); }
    }
  }
});

test("expired visitor token recovers with a new conversation", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("chat-token", "invalid-stale-token"));
  await page.goto("/visitor");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("chat-token"))).not.toBe("invalid-stale-token");
  await page.getByRole("button", { name: "Open chat" }).click();
  await expect(composer(page)).toBeEnabled();
  const token = await page.evaluate(() => localStorage.getItem("chat-token"));
  const db = new PrismaClient();
  try {
    await db.conversation.deleteMany({ where: { tokenHash: createHash("sha256").update(token!).digest("hex") } });
  } finally { await db.$disconnect(); }
});

test("admin sort, mark-read persists, leave notice, visitor localStorage return", async ({ browser }) => {
  const visitorContext = await browser.newContext({ baseURL: "http://127.0.0.1:43100" });
  const operatorContext = await browser.newContext({ baseURL: "http://127.0.0.1:43100" });
  const tokens: string[] = [];
  try {
    const visitorA = await visitorContext.newPage();
    await visitorA.goto("/visitor");
    await expect.poll(() => visitorA.evaluate(() => localStorage.getItem("chat-token"))).toBeTruthy();
    tokens.push((await visitorA.evaluate(() => localStorage.getItem("chat-token")))!);
    await visitorA.getByRole("button", { name: "Open chat" }).click();
    await send(visitorA, "sort-older");

    // Second visitor in a fresh context (separate localStorage)
    const visitorBContext = await browser.newContext({ baseURL: "http://127.0.0.1:43100" });
    const visitorB = await visitorBContext.newPage();
    await visitorB.goto("/visitor");
    await expect.poll(() => visitorB.evaluate(() => localStorage.getItem("chat-token"))).toBeTruthy();
    tokens.push((await visitorB.evaluate(() => localStorage.getItem("chat-token")))!);
    await visitorB.getByRole("button", { name: "Open chat" }).click();
    await send(visitorB, "sort-newer");

    const operator = await operatorContext.newPage();
    await loginOperator(operator);
    await expect(operator.getByTestId("conversation-row").first()).toContainText("sort-newer");
    const rows = operator.getByTestId("conversation-row");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("sort-newer");
    await expect(rows.nth(1)).toContainText("sort-older");

    // Unread badge on older (not opened); open it and badge clears; survives reload via DB
    await expect(rows.nth(1).getByTestId("unread-badge")).toBeVisible();
    await rows.nth(1).click();
    await expect(composer(operator)).toBeEnabled();
    await expect(rows.nth(1).getByTestId("unread-badge")).toHaveCount(0);
    await operator.reload();
    await loginOperator(operator);
    await expect(operator.getByTestId("conversation-row")).toHaveCount(2);
    // After reload nothing is selected; the previously opened older chat should stay without unread
    const older = operator.getByTestId("conversation-row").filter({ hasText: "sort-older" });
    await expect(older.getByTestId("unread-badge")).toHaveCount(0);
    const newer = operator.getByTestId("conversation-row").filter({ hasText: "sort-newer" });
    await expect(newer.getByTestId("unread-badge")).toBeVisible();
    await older.click();
    await expect(composer(operator)).toBeEnabled();

    // Leave notice: close visitor A (disconnect)
    await visitorA.close();
    await expect(operator.getByTestId("presence-notice")).toContainText("left the chat", { timeout: 15000 });
    await expect(operator.getByTestId("offline-composer-hint")).toBeVisible();
    await send(operator, "for-offline-visitor");

    // Visitor returns in a NEW context page with same localStorage storageState
    const storage = await visitorContext.storageState();
    // visitorA closed but context may still hold storage — use new page on same context
    const visitorBack = await visitorContext.newPage();
    await visitorBack.goto("/visitor");
    await expect.poll(() => visitorBack.evaluate(() => localStorage.getItem("chat-token"))).toBe(tokens[0]);
    await visitorBack.getByRole("button", { name: "Open chat" }).click();
    await expect(visitorBack.getByText("sort-older", { exact: true })).toBeVisible();
    await expect(visitorBack.getByText("for-offline-visitor", { exact: true })).toBeVisible();
    await expect(operator.getByTestId("presence-notice").last()).toContainText("returned", { timeout: 15000 });

    await visitorBack.close();
    await visitorBContext.close();
    void storage;
  } finally {
    await visitorContext.close();
    await operatorContext.close();
    if (tokens.length) {
      const db = new PrismaClient();
      try {
        for (const token of tokens) {
          await db.conversation.deleteMany({
            where: { tokenHash: createHash("sha256").update(token).digest("hex") },
          });
        }
      } finally { await db.$disconnect(); }
    }
  }
});
