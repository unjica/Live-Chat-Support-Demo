import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { io, Socket } from "socket.io-client";
import { clientIp, clientIpHeader, resolveClientIp, securityHeaders, trustedProxyHops } from "../src/security";

describe("clientIp", () => {
  it("ignores spoofed X-Forwarded-For when hops=0", () => {
    expect(clientIp("10.0.0.5", "1.2.3.4", 0)).toBe("10.0.0.5");
  });
  it("picks the right-most entry with hops=1", () => {
    expect(clientIp("10.0.0.5", "6.6.6.6, 203.0.113.9", 1)).toBe("203.0.113.9");
  });
  it("picks the entry left of the trusted proxies with hops=2", () => {
    expect(clientIp("10.0.0.5", "6.6.6.6, 203.0.113.9, 10.1.1.1", 2)).toBe("203.0.113.9");
  });
  it("falls back to the peer for invalid or missing entries", () => {
    expect(clientIp("10.0.0.5", "not-an-ip", 1)).toBe("10.0.0.5");
    expect(clientIp("10.0.0.5", undefined, 1)).toBe("10.0.0.5");
    expect(clientIp("10.0.0.5", "203.0.113.9", 3)).toBe("10.0.0.5");
  });
  it("normalizes IPv4-mapped IPv6 and accepts IPv6", () => {
    expect(clientIp("::ffff:10.0.0.5", undefined, 0)).toBe("10.0.0.5");
    expect(clientIp("10.0.0.5", "2001:db8::1", 1)).toBe("2001:db8::1");
  });
  it("validates TRUST_PROXY_HOPS", () => {
    expect(trustedProxyHops(undefined)).toBe(0);
    expect(trustedProxyHops("1")).toBe(1);
    expect(() => trustedProxyHops("-1")).toThrow();
    expect(() => trustedProxyHops("abc")).toThrow();
  });
  it("prefers a configured trusted client IP header", () => {
    const h = { "x-real-ip": "203.0.113.5", "x-forwarded-for": "6.6.6.6, 100.64.0.2" };
    expect(resolveClientIp("100.64.0.9", h, 0, "x-real-ip")).toBe("203.0.113.5");
    expect(resolveClientIp("100.64.0.9", h, 0, undefined)).toBe("100.64.0.9");
    expect(resolveClientIp("100.64.0.9", { "x-real-ip": "bogus" }, 0, "x-real-ip")).toBe("100.64.0.9");
    expect(clientIpHeader(" X-Real-IP ")).toBe("x-real-ip");
    expect(clientIpHeader("")).toBeUndefined();
    expect(() => clientIpHeader("bad header")).toThrow();
  });
  it("adds HSTS only in production", () => {
    expect(securityHeaders(true)["Strict-Transport-Security"]).toContain("max-age=");
    expect(securityHeaders(false)["Strict-Transport-Security"]).toBeUndefined();
  });
});

describe("connection rate limit and headers (integration)", () => {
  const sockets: Socket[] = [];
  const apps: INestApplication[] = [];
  beforeAll(() => {
    if (!process.env.DATABASE_URL)
      throw new Error("Set DATABASE_URL to a migrated PostgreSQL test database");
    process.env.OPERATOR_SECRET ||= "integration-only-secret-32-characters-long";
    process.env.NODE_ENV = "test";
  });
  afterEach(async () => {
    sockets.splice(0).forEach((s) => s.disconnect());
    await Promise.all(apps.splice(0).map((a) => a.close()));
  });
  async function start(hops: string, ipHeader = "") {
    process.env.TRUST_PROXY_HOPS = hops;
    process.env.CLIENT_IP_HEADER = ipHeader;
    const { createApp } = await import("../src/main");
    const app = await createApp();
    delete process.env.TRUST_PROXY_HOPS;
    delete process.env.CLIENT_IP_HEADER;
    apps.push(app);
    await app.listen(0, "127.0.0.1");
    return app.getUrl();
  }
  function attempt(url: string, xff: string, realIp?: string): Promise<boolean> {
    const s = io(url, {
      transports: ["websocket"],
      forceNew: true,
      reconnection: false,
      extraHeaders: realIp ? { "X-Forwarded-For": xff, "X-Real-IP": realIp } : { "X-Forwarded-For": xff },
    });
    sockets.push(s);
    return new Promise((resolve) => {
      s.once("connect", () => resolve(true));
      s.once("connect_error", () => resolve(false));
    });
  }
  async function burst(url: string, xff: (i: number) => string, n: number) {
    const results: boolean[] = [];
    for (let i = 0; i < n; i++) results.push(await attempt(url, xff(i)));
    return results;
  }

  it("hops=1 limits per forwarded client and rejects the 61st connection", async () => {
    const url = await start("1");
    const r = await burst(url, () => "198.51.100.1, 203.0.113.7", 61);
    expect(r.slice(0, 60).every(Boolean)).toBe(true);
    expect(r[60]).toBe(false);
    // Spoofing a different left-most entry does not create a new bucket.
    expect(await attempt(url, "198.51.100.99, 203.0.113.7")).toBe(false);
    // A different real client still gets its own bucket.
    expect(await attempt(url, "203.0.113.8")).toBe(true);
  });

  it("CLIENT_IP_HEADER=x-real-ip limits per header value despite rotating XFF", async () => {
    const url = await start("0", "x-real-ip");
    const r: boolean[] = [];
    for (let i = 0; i < 61; i++) r.push(await attempt(url, `198.51.100.${i + 1}`, "203.0.113.20"));
    expect(r.slice(0, 60).every(Boolean)).toBe(true);
    expect(r[60]).toBe(false);
    expect(await attempt(url, "198.51.100.1", "203.0.113.21")).toBe(true);
  });

  it("hops=0 ignores rotating spoofed X-Forwarded-For", async () => {
    const url = await start("0");
    const r = await burst(url, (i) => `203.0.113.${i + 1}`, 61);
    expect(r.slice(0, 60).every(Boolean)).toBe(true);
    expect(r[60]).toBe(false);
  });

  it("accepts every configured cross-origin frontend and rejects unlisted preview origins", async () => {
    process.env.FRONTEND_URL =
      "https://live-chat-support-demo.vercel.app, https://live-chat.tacko.io,https://live-chat-support-demo-git-release-v2-unjicas-projects.vercel.app";
    const url = await start("0");
    delete process.env.FRONTEND_URL;
    const withOrigin = (origin: string) => {
      const s = io(url, { transports: ["websocket"], forceNew: true, reconnection: false, extraHeaders: { Origin: origin } });
      sockets.push(s);
      return new Promise<boolean>((resolve) => {
        s.once("connect", () => resolve(true));
        s.once("connect_error", () => resolve(false));
      });
    };
    expect(await withOrigin("https://live-chat.tacko.io")).toBe(true);
    expect(await withOrigin("https://live-chat-support-demo.vercel.app")).toBe(true);
    expect(await withOrigin("https://live-chat-support-demo-git-release-v2-unjicas-projects.vercel.app")).toBe(true);
    expect(await withOrigin("https://live-chat-support-demo-q1vpm8z8d-unjicas-projects.vercel.app")).toBe(false);
    expect(await withOrigin("https://chat.tacko.io")).toBe(false);
    const res = await fetch(url + "/socket.io/?EIO=4&transport=polling", { headers: { Origin: "https://evil.example" } });
    expect(res.status).toBe(403);
  });

  it("sends security headers without x-powered-by on HTTP and Engine.IO", async () => {
    const url = await start("0");
    for (const path of ["/", "/socket.io/?EIO=4&transport=polling"]) {
      const res = await fetch(url + path);
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
      expect(res.headers.get("referrer-policy")).toBe("no-referrer");
      expect(res.headers.get("x-powered-by")).toBeNull();
    }
  });
});
