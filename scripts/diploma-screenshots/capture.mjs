/**
 * Diploma screenshot capture — isolated local stack only.
 * Viewport 1440×900, deviceScaleFactor 2. Never logs OPERATOR_SECRET.
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../../docs/diploma/gradivo/screenshots");
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const SECRET = process.env.OPERATOR_SECRET;
const PGURL =
  process.env.DATABASE_URL ||
  "postgresql://chat@127.0.0.1:55432/diploma_gradivo";

if (!SECRET || SECRET.length < 32) {
  console.error("OPERATOR_SECRET (32+ chars) required; use local-only secret.");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const VIEW = { width: 1440, height: 900, deviceScaleFactor: 2 };

const HIDE_OVERLAYS = `
  /* SocketInitializer connection badge */
  .fixed.bottom-0.left-0.z-50 { display: none !important; }
  /* Next.js dev indicator / build badge */
  nextjs-portal,
  [data-next-badge-root],
  [data-nextjs-toast],
  [data-next-mark-loading],
  #__next-build-watcher,
  body > div[style*="z-index: 2147483647"] { display: none !important; }
`;

function truncateDb() {
  execSync(
    `psql "${PGURL}" -c 'TRUNCATE "Message", "Conversation" CASCADE;'`,
    { stdio: "ignore" },
  );
}

async function prepare(page) {
  await page.addStyleTag({ content: HIDE_OVERLAYS });
  page.on("load", async () => {
    try {
      await page.addStyleTag({ content: HIDE_OVERLAYS });
    } catch {
      /* navigated away */
    }
  });
}

async function shot(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, name), fullPage: false });
  console.log("wrote", name);
}

async function expectEnabled(locator) {
  await locator.waitFor({ state: "visible", timeout: 20000 });
  for (let i = 0; i < 40; i++) {
    if (await locator.isEnabled()) return;
    await locator.page().waitForTimeout(250);
  }
  throw new Error("composer not enabled");
}

async function send(page, text) {
  const box = page.getByPlaceholder("Type a message");
  await expectEnabled(box);
  await box.fill(text);
  await box.press("Enter");
  await page.waitForTimeout(400);
}

async function loginOperator(page) {
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await prepare(page);
  await page.getByLabel("Operator secret").fill(SECRET);
  await shot(page, "04-admin-prijava.png");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.locator("h2:visible", { hasText: "Conversations" }).waitFor({
    timeout: 20000,
  });
  await prepare(page);
}

async function openChat(page) {
  await page.goto(`${BASE}/visitor`, { waitUntil: "networkidle" });
  await prepare(page);
  await page.waitForFunction(() => !!localStorage.getItem("chat-token"), null, {
    timeout: 20000,
  });
  await page.getByRole("button", { name: "Open chat" }).click();
  await expectEnabled(page.getByPlaceholder("Type a message"));
}

async function main() {
  truncateDb();
  const browser = await chromium.launch({ headless: true });

  {
    const ctx = await browser.newContext({ viewport: VIEW, baseURL: BASE });
    const page = await ctx.newPage();
    await page.goto("/", { waitUntil: "networkidle" });
    await prepare(page);
    await shot(page, "01-zacetna-stran.png");
    await ctx.close();
  }

  {
    const ctx = await browser.newContext({ viewport: VIEW, baseURL: BASE });
    const page = await ctx.newPage();
    await page.goto("/visitor", { waitUntil: "networkidle" });
    await prepare(page);
    await page.waitForFunction(() => !!localStorage.getItem("chat-token"));
    await shot(page, "02-obiskovalec-pred-pogovorom.png");
    await page.getByRole("button", { name: "Open chat" }).click();
    await expectEnabled(page.getByPlaceholder("Type a message"));
    await shot(page, "02b-obiskovalec-prazno-okno.png");
    await ctx.close();
  }

  // Clear conversations created by the preliminary visitor shots
  truncateDb();

  const visitorACtx = await browser.newContext({ viewport: VIEW, baseURL: BASE });
  const visitorBCtx = await browser.newContext({ viewport: VIEW, baseURL: BASE });
  const operatorCtx = await browser.newContext({ viewport: VIEW, baseURL: BASE });
  const visitorA = await visitorACtx.newPage();
  const visitorB = await visitorBCtx.newPage();
  const operator = await operatorCtx.newPage();

  await openChat(visitorA);
  await send(
    visitorA,
    "Pozdravljeni, sem Ana Novak. Zanima me, kako poteka naročnina.",
  );
  await send(visitorA, "Ali lahko spremenim paket tudi sredi meseca?");
  await send(visitorA, "Hvala za pomoč vnaprej.");
  await shot(visitorA, "03-obiskovalec-pogovor.png");

  await openChat(visitorB);
  await send(
    visitorB,
    "Dober dan, Marko Horvat. Imam težavo s prijavo v portal.",
  );
  await send(visitorB, "Po vnosu gesla dobim napako 403.");

  await loginOperator(operator);
  await operator.getByTestId("conversation-row").first().waitFor({
    timeout: 20000,
  });
  for (let i = 0; i < 40; i++) {
    if ((await operator.getByTestId("conversation-row").count()) >= 2) break;
    await operator.waitForTimeout(250);
  }
  // Exactly two active visitors for the list shot
  await shot(operator, "05-admin-seznam-pogovorov.png");

  const anaRow = operator
    .getByTestId("conversation-row")
    .filter({ hasText: "Hvala za pomoč" });
  await anaRow.click();
  const anaId = await anaRow.getAttribute("data-conversation-id");
  if (!anaId) throw new Error("missing ana conversation id");
  await expectEnabled(operator.getByPlaceholder("Type a message"));
  await send(
    operator,
    "Pozdravljeni, Ana. Paket lahko spremenite kadarkoli; obračun se prilagodi naslednji dan.",
  );
  await visitorA
    .getByText("Paket lahko spremenite", { exact: false })
    .waitFor({ timeout: 15000 });
  await shot(operator, "06-admin-odprt-pogovor-odgovor.png");
  await shot(visitorA, "06b-obiskovalec-prejet-odgovor.png");

  await shot(operator, "07a-admin-seznam-dveh-pogovorov.png");
  const markoRow = operator
    .getByTestId("conversation-row")
    .filter({ hasText: "napako 403" });
  await markoRow.click();
  await operator.waitForTimeout(600);
  await shot(operator, "07b-admin-drugi-pogovor.png");
  await shot(visitorB, "07c-obiskovalec-b-pogovor.png");

  await operator
    .locator(
      `[data-testid="conversation-row"][data-conversation-id="${anaId}"]`,
    )
    .click();
  await operator.waitForTimeout(400);
  await visitorACtx.close();
  await operator
    .getByTestId("presence-notice")
    .filter({ hasText: "left" })
    .waitFor({ timeout: 20000 });
  await shot(operator, "08-obvestilo-odhod.png");

  const visitorCCtx = await browser.newContext({
    viewport: VIEW,
    baseURL: BASE,
  });
  const visitorC = await visitorCCtx.newPage();
  await openChat(visitorC);
  const tokenC = await visitorC.evaluate(() =>
    localStorage.getItem("chat-token"),
  );
  await send(
    visitorC,
    "Pozdravljeni, Petra Kovač. Kratko vprašanje o dostavi.",
  );
  const petraRow = operator
    .getByTestId("conversation-row")
    .filter({ hasText: "dostavi" });
  await petraRow.waitFor({ timeout: 20000 });
  await petraRow.click();
  const petraId = await petraRow.getAttribute("data-conversation-id");
  await operator.waitForTimeout(500);
  await visitorCCtx.close();
  await operator
    .getByTestId("presence-notice")
    .filter({ hasText: "left" })
    .waitFor({ timeout: 20000 });

  const visitorC2Ctx = await browser.newContext({
    viewport: VIEW,
    baseURL: BASE,
  });
  await visitorC2Ctx.addInitScript((t) => {
    localStorage.setItem("chat-token", t);
  }, tokenC);
  const visitorC2 = await visitorC2Ctx.newPage();
  await visitorC2.goto(`${BASE}/visitor`, { waitUntil: "networkidle" });
  await prepare(visitorC2);
  await visitorC2.getByRole("button", { name: "Open chat" }).click();
  await visitorC2
    .getByText("Petra Kovač", { exact: false })
    .waitFor({ timeout: 20000 });
  await operator
    .locator(
      `[data-testid="conversation-row"][data-conversation-id="${petraId}"]`,
    )
    .click();
  await operator
    .getByTestId("presence-notice")
    .filter({ hasText: "returned" })
    .waitFor({ timeout: 20000 });
  await shot(operator, "09-obvestilo-vrnitev.png");
  await shot(visitorC2, "10-obnovljena-zgodovina.png");

  await visitorBCtx.close();
  await visitorC2Ctx.close();
  await operatorCtx.close();
  await browser.close();
  console.log("ALL_SCREENSHOTS_DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
