import { isIP } from "net";

/** Parses TRUST_PROXY_HOPS: number of trusted reverse proxies in front of the app. */
export function trustedProxyHops(raw = process.env.TRUST_PROXY_HOPS): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const hops = Number(raw);
  if (!Number.isInteger(hops) || hops < 0 || hops > 10)
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 10");
  return hops;
}

function normalize(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  let value = ip.trim();
  if (value.startsWith("[") && value.includes("]")) value = value.slice(1, value.indexOf("]"));
  if (value.toLowerCase().startsWith("::ffff:") && isIP(value.slice(7)) === 4) value = value.slice(7);
  return isIP(value) ? value : undefined;
}

/**
 * Resolves the client IP. With hops=0 the forwarding header is ignored and the
 * socket peer is used. With hops=N the peer plus the right-most N-1 header
 * entries are trusted proxies; the next entry to the left is the client.
 * Entries further left are client-controlled and never used. Invalid entries
 * fall back to the socket peer.
 */
export function clientIp(
  remoteAddress: string | undefined,
  forwardedFor: string | string[] | undefined,
  hops: number,
): string {
  const peer = normalize(remoteAddress) ?? "unknown";
  if (hops <= 0 || forwardedFor === undefined) return peer;
  const header = Array.isArray(forwardedFor) ? forwardedFor.join(",") : forwardedFor;
  const chain = header.split(",").map((s) => s.trim()).filter(Boolean);
  // chain + peer, right-most `hops` addresses are trusted proxies.
  const index = chain.length - hops;
  if (index < 0) return peer;
  return normalize(chain[index]) ?? peer;
}

/** Minimal security headers for a JSON/WebSocket API (no HTML is served). */
export function securityHeaders(production = process.env.NODE_ENV === "production") {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
  if (production) headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  return headers;
}
