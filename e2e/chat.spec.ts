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

test("H3: ordered two-way display and reconnect without page reload", async ({ browser }) => {
  const visitorContext = await browser.newContext({ baseURL: "http://127.0.0.1:43100" });
  const operatorContext = await browser.newContext({ baseURL: "http://127.0.0.1:43100" });
  const visitor = await visitorContext.newPage();
  const operator = await operatorContext.newPage();
  let token: string | null = null;
  try {
    let interrupted = false;
    let transport: WebSocketRoute | undefined;
    // Proxy real Socket.IO traffic; closing the transport exercises automatic reconnect.
    await visitorContext.routeWebSocket("ws://127.0.0.1:43101/**", (route) => {
      if (interrupted) { void route.close(); return; }
      transport = route;
      route.connectToServer();
    });
    await visitor.goto("/visitor");
    await expect.poll(() => visitor.evaluate(() => sessionStorage.getItem("chat-token"))).toBeTruthy();
    token = await visitor.evaluate(() => sessionStorage.getItem("chat-token"));
    await visitor.getByRole("button", { name: "Open chat" }).click();
    await expect(composer(visitor)).toBeEnabled();
    await operator.goto("/admin");
    await operator.getByLabel("Operator secret").fill(process.env.OPERATOR_SECRET!);
    await operator.getByRole("button", { name: "Connect", exact: true }).click();
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
  await page.addInitScript(() => sessionStorage.setItem("chat-token", "invalid-stale-token"));
  await page.goto("/visitor");
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem("chat-token"))).not.toBe("invalid-stale-token");
  await page.getByRole("button", { name: "Open chat" }).click();
  await expect(composer(page)).toBeEnabled();
  const token = await page.evaluate(() => sessionStorage.getItem("chat-token"));
  const db = new PrismaClient();
  try {
    await db.conversation.deleteMany({ where: { tokenHash: createHash("sha256").update(token!).digest("hex") } });
  } finally { await db.$disconnect(); }
});
