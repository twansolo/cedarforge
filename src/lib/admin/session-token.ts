/**
 * Stateless admin session tokens.
 *
 * A token is `base64url(payload).base64url(HMAC-SHA256(payload))`, signed with
 * ADMIN_SESSION_SECRET. There is no database: the signature is the proof, so
 * the payload is readable but not forgeable, and it therefore carries no
 * secrets — just a subject, timestamps, and a password fingerprint.
 *
 * Signing uses Web Crypto rather than `node:crypto` so this module works
 * unchanged in the proxy, in server components, and in route handlers.
 *
 * Everything here fails closed: a malformed token, a bad signature, a missing
 * secret, or a rotated password all resolve to `null`, never to a session.
 */

const TOKEN_VERSION = 1;

export type AdminSession = {
  /** Token format version, so a future change can invalidate old cookies. */
  v: number;
  /** Subject. Single-operator today, ready for real user ids later. */
  sub: string;
  /** Issued at, seconds since epoch. */
  iat: number;
  /** Expires at, seconds since epoch. */
  exp: number;
  /**
   * Password fingerprint. Rotating ADMIN_PASSWORD_HASH changes this value,
   * which invalidates every previously issued cookie. That makes "change the
   * password" a working remote sign-out for a stateless session.
   */
  pv: string;
};

const encoder = new TextEncoder();

function encodeBase64Url(input: Uint8Array | string): string {
  const bytes =
    typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input);
  return bytes.toString("base64url");
}

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

/** Cached per secret value so a rotation is picked up without a restart. */
let cachedKey: { secret: string; key: Promise<CryptoKey> } | null = null;

let warnedMissingSecret = false;

function signingKey(): Promise<CryptoKey> | null {
  const secret = process.env.ADMIN_SESSION_SECRET;

  // 32 bytes of entropy is the floor for an HMAC-SHA256 key. A short or absent
  // secret disables the admin area rather than weakening it.
  if (!secret || secret.length < 32) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.error(
        "[admin] ADMIN_SESSION_SECRET is missing or shorter than 32 characters. " +
          "The admin area is locked until it is set. Generate one with: openssl rand -base64 32",
      );
    }
    return null;
  }

  if (cachedKey?.secret !== secret) {
    cachedKey = {
      secret,
      key: crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      ),
    };
  }

  return cachedKey.key;
}

let cachedFingerprint: { source: string; value: Promise<string> } | null = null;

/**
 * Short digest of the stored password hash. Not a secret, and not reversible
 * to the password: the input is already a salted scrypt hash.
 */
export async function passwordFingerprint(): Promise<string | null> {
  const source = process.env.ADMIN_PASSWORD_HASH;
  if (!source) return null;

  if (cachedFingerprint?.source !== source) {
    cachedFingerprint = {
      source,
      value: crypto.subtle
        .digest("SHA-256", encoder.encode(source))
        .then((digest) =>
          Buffer.from(digest).toString("hex").slice(0, 16),
        ),
    };
  }

  return cachedFingerprint.value;
}

/** Signs a new session token. Returns `null` when the area is misconfigured. */
export async function createSessionToken(
  subject: string,
  maxAgeSeconds: number,
): Promise<string | null> {
  const key = signingKey();
  const pv = await passwordFingerprint();
  if (!key || !pv) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: AdminSession = {
    v: TOKEN_VERSION,
    sub: subject,
    iat: issuedAt,
    exp: issuedAt + maxAgeSeconds,
    pv,
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await key,
    encoder.encode(encodedPayload),
  );

  return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

/**
 * Verifies a token and returns its payload, or `null` if it is not a currently
 * valid session. Signature verification runs through `crypto.subtle.verify`,
 * which compares in constant time.
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<AdminSession | null> {
  if (!token) return null;

  const key = signingKey();
  if (!key) return null;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator === token.length - 1) return null;

  const encodedPayload = token.slice(0, separator);
  const encodedSignature = token.slice(separator + 1);

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await key,
      // WebCrypto wants a BufferSource backed by a plain ArrayBuffer. A Node
      // Buffer is typed over ArrayBufferLike, so copy the bytes into a view.
      // Same bytes, same comparison.
      new Uint8Array(decodeBase64Url(encodedSignature)),
      encoder.encode(encodedPayload),
    );
    if (!valid) return null;

    const payload = JSON.parse(
      decodeBase64Url(encodedPayload).toString("utf8"),
    ) as AdminSession;

    if (payload.v !== TOKEN_VERSION) return null;
    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    if (typeof payload.exp !== "number") return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

    // A rotated password invalidates sessions signed against the old one.
    const pv = await passwordFingerprint();
    if (!pv || payload.pv !== pv) return null;

    return payload;
  } catch {
    return null;
  }
}

/** Seconds of life left on a session, floored at zero. */
export function secondsRemaining(session: AdminSession): number {
  return Math.max(0, session.exp - Math.floor(Date.now() / 1000));
}
