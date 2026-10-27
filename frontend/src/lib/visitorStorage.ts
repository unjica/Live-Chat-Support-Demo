/** Visitor bearer token persistence. localStorage so a closed tab can return to the same chat. */
export const VISITOR_TOKEN_KEY = "chat-token";

/** In-memory fallback when localStorage is blocked or full. */
let memoryToken: string | null = null;

function readLocal(): string | null {
  try {
    return localStorage.getItem(VISITOR_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeLocal(token: string): boolean {
  try {
    localStorage.setItem(VISITOR_TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

function removeLocal(): boolean {
  try {
    localStorage.removeItem(VISITOR_TOKEN_KEY);
    return true;
  } catch {
    return false;
  }
}

export function getVisitorToken(): string | null {
  if (typeof window === "undefined") return null;
  const fromLocal = readLocal();
  if (fromLocal) {
    memoryToken = fromLocal;
    return fromLocal;
  }
  if (memoryToken) return memoryToken;
  // One-time migrate from older sessionStorage builds.
  try {
    const legacy = sessionStorage.getItem(VISITOR_TOKEN_KEY);
    if (legacy) {
      if (!writeLocal(legacy)) {
        memoryToken = legacy;
        return legacy;
      }
      try {
        sessionStorage.removeItem(VISITOR_TOKEN_KEY);
      } catch {
        /* ignore */
      }
      memoryToken = legacy;
      return legacy;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setVisitorToken(token: string) {
  memoryToken = token;
  writeLocal(token);
  try {
    sessionStorage.removeItem(VISITOR_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Clears storage; returns false if localStorage remove failed (token may linger). */
export function clearVisitorToken(): boolean {
  memoryToken = null;
  const ok = removeLocal();
  try {
    sessionStorage.removeItem(VISITOR_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  return ok;
}
