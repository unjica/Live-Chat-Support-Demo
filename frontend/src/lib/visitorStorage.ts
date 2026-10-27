/** Visitor bearer token persistence. localStorage so a closed tab can return to the same chat. */
export const VISITOR_TOKEN_KEY = "chat-token";

export function getVisitorToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = localStorage.getItem(VISITOR_TOKEN_KEY);
  if (fromLocal) return fromLocal;
  // One-time migrate from older sessionStorage builds.
  try {
    const legacy = sessionStorage.getItem(VISITOR_TOKEN_KEY);
    if (legacy) {
      localStorage.setItem(VISITOR_TOKEN_KEY, legacy);
      sessionStorage.removeItem(VISITOR_TOKEN_KEY);
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setVisitorToken(token: string) {
  localStorage.setItem(VISITOR_TOKEN_KEY, token);
  try {
    sessionStorage.removeItem(VISITOR_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function clearVisitorToken() {
  localStorage.removeItem(VISITOR_TOKEN_KEY);
  try {
    sessionStorage.removeItem(VISITOR_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
