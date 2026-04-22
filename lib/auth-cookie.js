const COOKIE_NAME = "hullboard_session";

function encoder() {
  return new TextEncoder();
}

function base64UrlEncode(bytes) {
  let binary = "";
  const u8 = new Uint8Array(bytes);
  for (let i = 0; i < u8.byteLength; i++) binary += String.fromCharCode(u8[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64UrlDecodeToUint8Array(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const raw = atob(b64 + pad);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function getKeyMaterial(secret) {
  const raw = secret || "dev-hullboard-session-secret-min-32-chars!";
  const buf = encoder().encode(raw);
  if (buf.byteLength >= 32) return buf.slice(0, 32);
  const padded = new Uint8Array(32);
  padded.set(buf);
  return padded;
}

export async function signSession(secret) {
  const payload = {
    sub: "admin",
    role: "ADMIN",
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  };
  const payloadStr = JSON.stringify(payload);
  const key = await crypto.subtle.importKey(
    "raw",
    getKeyMaterial(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder().encode(payloadStr),
  );
  const payloadB64 = base64UrlEncode(encoder().encode(payloadStr));
  const sigB64 = base64UrlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const dot = token.indexOf(".");
  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);
  let payloadStr;
  try {
    payloadStr = new TextDecoder().decode(base64UrlDecodeToUint8Array(payloadB64));
  } catch {
    return false;
  }
  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return false;
  }
  if (!payload?.exp || typeof payload.exp !== "number") return false;
  if (payload.exp < Math.floor(Date.now() / 1000)) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    getKeyMaterial(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder().encode(payloadStr),
  );
  const expectedB64 = base64UrlEncode(expected);
  if (expectedB64.length !== sigB64.length) return false;
  let diff = 0;
  for (let i = 0; i < expectedB64.length; i++) {
    diff |= expectedB64.charCodeAt(i) ^ sigB64.charCodeAt(i);
  }
  return diff === 0;
}

export function sessionCookieName() {
  return COOKIE_NAME;
}
