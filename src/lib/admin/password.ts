/**
 * Password verification for the single admin operator.
 *
 * The password itself is never stored or committed. ADMIN_PASSWORD_HASH holds a
 * salted scrypt digest produced by `npm run admin:hash`, and this module only
 * ever compares against that digest.
 *
 * scrypt is memory-hard, which makes offline guessing expensive, and it ships
 * with Node so no dependency is added. Parameters live inside the stored string
 * so they can be raised later without invalidating existing hashes.
 */

import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { promisify } from "node:util";

/*
 * `scrypt` is overloaded, with and without an options argument. Bare
 * `promisify(scrypt)` resolves to the 3-argument overload, so passing options
 * fails to type check. Naming the signature selects the right one. Runtime
 * behaviour is unchanged.
 */
const scryptAsync = promisify<string, Buffer, number, ScryptOptions, Buffer>(
  scrypt,
);

const ALGORITHM = "scrypt";

/**
 * Field separator.
 *
 * `:` rather than the conventional `$`, because Next expands `$NAME` inside
 * .env files. A `$`-delimited hash silently loses characters there, which then
 * looks like a wrong password rather than a mangled value. `:` is outside the
 * base64 alphabet, so it cannot collide with the salt or the digest.
 */
const SEPARATOR = ":";

/** Current work factors. Roughly 100–200 ms per verification on a small VM. */
const DEFAULT_PARAMS = { N: 32768, r: 8, p: 1, keyLength: 64 } as const;

type ScryptParams = {
  N: number;
  r: number;
  p: number;
  keyLength: number;
  salt: Buffer;
  hash: Buffer;
};

/** scrypt needs ~128 * N * r bytes; double it so Node's default cap is not hit. */
function maxmemFor(N: number, r: number) {
  return 256 * N * r;
}

/**
 * Hashes a password into the storable string format:
 * `scrypt:N:r:p:keyLength:saltBase64:hashBase64`
 */
export async function hashPassword(password: string): Promise<string> {
  const { N, r, p, keyLength } = DEFAULT_PARAMS;
  const salt = randomBytes(16);

  const derived = (await scryptAsync(password.normalize("NFKC"), salt, keyLength, {
    N,
    r,
    p,
    maxmem: maxmemFor(N, r),
  })) as Buffer;

  return [
    ALGORITHM,
    N,
    r,
    p,
    keyLength,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join(SEPARATOR);
}

function parseStoredHash(stored: string): ScryptParams | null {
  const parts = stored.trim().split(SEPARATOR);
  if (parts.length !== 7) return null;

  const [algorithm, rawN, rawR, rawP, rawKeyLength, rawSalt, rawHash] = parts;
  if (algorithm !== ALGORITHM) return null;

  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);
  const keyLength = Number(rawKeyLength);

  const sane =
    Number.isInteger(N) &&
    N > 1 &&
    (N & (N - 1)) === 0 && // scrypt requires a power of two
    Number.isInteger(r) &&
    r > 0 &&
    Number.isInteger(p) &&
    p > 0 &&
    Number.isInteger(keyLength) &&
    keyLength >= 32 &&
    keyLength <= 128;

  if (!sane) return null;

  const salt = Buffer.from(rawSalt, "base64");
  const hash = Buffer.from(rawHash, "base64");
  if (salt.length < 8 || hash.length !== keyLength) return null;

  return { N, r, p, keyLength, salt, hash };
}

/**
 * Constant-time comparison of a submitted password against ADMIN_PASSWORD_HASH.
 *
 * Returns `false` for every failure mode, including a missing or malformed
 * environment variable, so a configuration mistake cannot open the door.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD_HASH;

  if (!stored) {
    console.error(
      "[admin] ADMIN_PASSWORD_HASH is not set. The admin area is locked until it is. " +
        "Generate a hash with: npm run admin:hash",
    );
    return false;
  }

  const params = parseStoredHash(stored);
  if (!params) {
    console.error(
      "[admin] ADMIN_PASSWORD_HASH is malformed. Regenerate it with: npm run admin:hash",
    );
    return false;
  }

  try {
    const derived = (await scryptAsync(
      password.normalize("NFKC"),
      params.salt,
      params.keyLength,
      {
        N: params.N,
        r: params.r,
        p: params.p,
        maxmem: maxmemFor(params.N, params.r),
      },
    )) as Buffer;

    return timingSafeEqual(derived, params.hash);
  } catch (error) {
    console.error("[admin] Password verification failed:", error);
    return false;
  }
}

/** True when both admin secrets are present and usable. */
export function isAdminConfigured(): boolean {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const stored = process.env.ADMIN_PASSWORD_HASH;
  return Boolean(
    secret && secret.length >= 32 && stored && parseStoredHash(stored),
  );
}
