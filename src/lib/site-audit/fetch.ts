import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Guarded outbound fetching for the Snapshot tool.
 *
 * ── Why this is not a bare fetch ─────────────────────────────────────────────
 * Every other outbound call in this codebase goes to a hard-coded host we
 * control the URL of. This one goes wherever an operator types, which makes it
 * server-side request forgery waiting to happen: `http://localhost:3000/admin`,
 * `http://169.254.169.254/latest/meta-data/` on a cloud instance, or a domain
 * whose DNS record points at a private address. Everything here exists to keep
 * that from working:
 *
 *   · http and https only, on their default ports, with no userinfo
 *   · hostnames resolved before connecting, and rejected if any address is
 *     private, loopback, link-local, or otherwise not publicly routable
 *   · redirects followed by hand, three hops maximum, each one re-validated
 *   · a per-request timeout and a hard cap on bytes read
 *
 * ── Known limitation ─────────────────────────────────────────────────────────
 * The resolve-then-connect check is time-of-check to time-of-use: a hostile DNS
 * server can answer with a public address for our lookup and a private one for
 * the connection that follows. Closing that needs the connection pinned to the
 * address we validated, which Node's fetch does not expose. The residual risk is
 * small here because the tool sits behind an admin session and reads a bounded
 * response, but it is real and worth knowing about.
 */

/** Per-request ceiling. Small-business sites that miss this are the finding. */
export const DEFAULT_TIMEOUT_MS = 8_000;

/** Bytes read from any single response before we stop and use what we have. */
const MAX_BYTES = 1_500_000;

/** Redirect hops followed. Marketing sites rarely need more than two. */
const MAX_REDIRECTS = 3;

/**
 * Sent so the sites we look at can identify and block this if they want to. A
 * scanner that hides what it is would be the wrong way to start a relationship
 * with a prospect.
 */
const USER_AGENT =
  "CedarForgeSnapshot/1.0 (+https://cedarforge.ai; systems snapshot for a prospective client)";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
  "instance-data",
]);

/** Suffixes that never belong to a public site. */
const BLOCKED_SUFFIXES = [
  ".local",
  ".localhost",
  ".internal",
  ".intranet",
  ".lan",
  ".home",
  ".corp",
  ".onion",
  ".test",
  ".example",
  ".invalid",
];

export type SiteAuditErrorKind =
  | "invalid-domain"
  | "blocked-host"
  | "dns"
  | "timeout"
  | "network"
  | "too-many-redirects"
  | "http-status"
  | "not-html";

/**
 * A failed lookup, carrying the kind so the page can explain what happened in
 * terms the operator can act on.
 */
export class SiteAuditError extends Error {
  constructor(
    readonly kind: SiteAuditErrorKind,
    message: string,
    /** HTTP status, when the failure was a response rather than a connection. */
    readonly status?: number,
  ) {
    super(message);
    this.name = "SiteAuditError";
  }

  /** Operator-facing explanation. Safe to render. */
  get operatorMessage() {
    switch (this.kind) {
      case "invalid-domain":
        return "That does not look like a domain. Enter something like example.com.";
      case "blocked-host":
        return "That host is not publicly routable, so there is nothing to audit. Enter a live public domain.";
      case "dns":
        return "That domain did not resolve. Check the spelling, or the site may no longer be hosted.";
      case "timeout":
        return "The site did not respond in time. That is worth noting on the call, but it means there is nothing to analyse here.";
      case "network":
        return "The connection failed before a response arrived. The site may be down, or blocking automated requests.";
      case "too-many-redirects":
        return "The site redirected more times than we follow. Try the URL it settles on.";
      case "http-status":
        return `The site responded ${this.status ?? "with an error"}. A homepage that does not return 200 is itself the headline finding.`;
      case "not-html":
        return "That URL did not return HTML. Point this at the public homepage.";
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Address checks                                                             */
/* -------------------------------------------------------------------------- */

function ipv4ToInt(address: string) {
  const parts = address.split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

/** CIDR blocks that are not publicly routable, or are reserved. */
const BLOCKED_V4: Array<[string, number]> = [
  ["0.0.0.0", 8], // this network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, including cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
];

function isPrivateV4(address: string) {
  const value = ipv4ToInt(address);
  if (value === null) return true; // Unparseable is not something to connect to.

  return BLOCKED_V4.some(([base, bits]) => {
    const baseValue = ipv4ToInt(base);
    if (baseValue === null) return false;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (baseValue & mask);
  });
}

function isPrivateV6(address: string) {
  const value = address.toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];

  if (value === "::" || value === "::1") return true;

  // IPv4-mapped and IPv4-translated forms delegate to the v4 rules.
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isPrivateV4(mapped[1]);

  const first = value.split(":")[0] ?? "";
  const group = Number.parseInt(first || "0", 16);

  if (Number.isNaN(group)) return true;
  if ((group & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((group & 0xffc0) === 0xfe80) return true; // fe80::/10 link local
  if (value.startsWith("2001:db8")) return true; // documentation
  if (value.startsWith("64:ff9b")) return true; // NAT64
  if (value.startsWith("100:")) return true; // discard-only

  return false;
}

export function isPrivateAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isPrivateV4(address);
  if (version === 6) return isPrivateV6(address);
  return true;
}

/**
 * Rejects anything that is not a public host. Throws rather than returning a
 * boolean so a missing check is a compile-time-visible omission at the call
 * site, not a silently ignored result.
 */
async function assertPublicHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (!host || BLOCKED_HOSTNAMES.has(host)) {
    throw new SiteAuditError("blocked-host", `Blocked hostname: ${host}`);
  }

  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    throw new SiteAuditError("blocked-host", `Blocked suffix: ${host}`);
  }

  if (isIP(host)) {
    if (isPrivateAddress(host)) {
      throw new SiteAuditError("blocked-host", `Private address: ${host}`);
    }
    return;
  }

  // A hostname with no dot is a local name, not a domain on the internet.
  if (!host.includes(".")) {
    throw new SiteAuditError("blocked-host", `Not a public hostname: ${host}`);
  }

  let records: Array<{ address: string }>;
  try {
    records = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new SiteAuditError("dns", `DNS lookup failed for ${host}`);
  }

  if (records.length === 0) {
    throw new SiteAuditError("dns", `No addresses for ${host}`);
  }

  for (const record of records) {
    if (isPrivateAddress(record.address)) {
      throw new SiteAuditError(
        "blocked-host",
        `${host} resolves to a private address`,
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/* URL normalisation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Turns operator input into a URL to try.
 *
 * Accepts what someone actually types: `example.com`, `www.example.com/`,
 * `https://example.com/home`, or a pasted URL with tracking parameters. The
 * scheme defaults to https, because a site that only answers on http is a
 * finding rather than a reason to fail.
 */
export function normaliseDomain(input: string): URL {
  const trimmed = input.trim().replace(/\s+/g, "");

  if (!trimmed) {
    throw new SiteAuditError("invalid-domain", "Empty domain");
  }

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new SiteAuditError("invalid-domain", `Unparseable: ${input}`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new SiteAuditError("invalid-domain", `Scheme: ${url.protocol}`);
  }

  // Credentials in a URL are a redirect-parser trick, never a real homepage.
  if (url.username || url.password) {
    throw new SiteAuditError("invalid-domain", "URL carries credentials");
  }

  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new SiteAuditError("blocked-host", `Non-standard port: ${url.port}`);
  }

  url.hash = "";
  url.search = "";
  return url;
}

/** Bare registrable-ish label, for display and for keyword matching. */
export function displayHost(url: URL) {
  return url.hostname.replace(/^www\./, "");
}

/* -------------------------------------------------------------------------- */
/* Fetching                                                                   */
/* -------------------------------------------------------------------------- */

export type FetchedPage = {
  /** Where we ended up, after redirects. */
  url: string;
  status: number;
  /** Redirect hops taken to get here. */
  redirects: number;
  /** True when the final URL is https. */
  https: boolean;
  contentType: string | null;
  body: string;
  bytes: number;
  /** True when the body hit MAX_BYTES and was cut short. */
  truncated: boolean;
  /** Milliseconds from request to response headers. */
  ttfbMs: number;
  /** Milliseconds until the body finished reading. */
  totalMs: number;
};

async function readCapped(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return { text: "", bytes: 0, truncated: false };

  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let truncated = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    const remaining = MAX_BYTES - bytes;
    if (value.byteLength >= remaining) {
      chunks.push(value.subarray(0, remaining));
      bytes = MAX_BYTES;
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }

    chunks.push(value);
    bytes += value.byteLength;
  }

  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return {
    // Never fatal: a mislabelled charset should not fail the whole audit.
    text: new TextDecoder("utf-8", { fatal: false }).decode(merged),
    bytes,
    truncated,
  };
}

/**
 * One hop. Redirects are returned rather than followed, so the caller can
 * re-validate the destination before connecting to it.
 */
async function fetchOnce(url: URL, accept: string, timeoutMs: number) {
  await assertPublicHost(url.hostname);

  const started = Date.now();
  let response: Response;

  try {
    response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: accept,
        "Accept-Language": "en-US,en;q=0.9",
      },
      // A prospect's live site is never something to keep a copy of.
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof SiteAuditError) throw error;

    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new SiteAuditError("timeout", `Timed out: ${url.href}`);
    }
    throw new SiteAuditError(
      "network",
      `Request failed: ${url.href} (${error instanceof Error ? error.message : "unknown"})`,
    );
  }

  return { response, ttfbMs: Date.now() - started, started };
}

/**
 * Fetches one URL, following redirects by hand.
 *
 * `require` decides whether a non-2xx or a non-HTML body is a failure. The
 * homepage must be both; robots.txt and sitemap.xml are best-effort, and their
 * absence is a finding rather than an error.
 */
export async function fetchPage(
  target: URL,
  {
    accept = "text/html,application/xhtml+xml",
    requireOk = true,
    requireHtml = true,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  }: {
    accept?: string;
    requireOk?: boolean;
    requireHtml?: boolean;
    timeoutMs?: number;
  } = {},
): Promise<FetchedPage> {
  let url = target;
  let redirects = 0;

  for (;;) {
    const { response, ttfbMs, started } = await fetchOnce(url, accept, timeoutMs);

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      response.body?.cancel().catch(() => {});

      if (redirects >= MAX_REDIRECTS) {
        throw new SiteAuditError(
          "too-many-redirects",
          `Exceeded ${MAX_REDIRECTS} hops from ${target.href}`,
        );
      }

      let next: URL;
      try {
        next = new URL(location, url);
      } catch {
        throw new SiteAuditError("network", `Bad redirect target: ${location}`);
      }

      if (next.protocol !== "https:" && next.protocol !== "http:") {
        throw new SiteAuditError(
          "blocked-host",
          `Redirect to ${next.protocol}`,
        );
      }

      next.hash = "";
      url = next;
      redirects += 1;
      continue;
    }

    const contentType = response.headers.get("content-type");

    if (requireOk && !response.ok) {
      response.body?.cancel().catch(() => {});
      throw new SiteAuditError(
        "http-status",
        `${url.href} responded ${response.status}`,
        response.status,
      );
    }

    const { text, bytes, truncated } = await readCapped(response);

    if (
      requireHtml &&
      response.ok &&
      contentType &&
      !/text\/html|application\/xhtml/i.test(contentType)
    ) {
      throw new SiteAuditError(
        "not-html",
        `${url.href} returned ${contentType}`,
      );
    }

    return {
      url: url.href,
      status: response.status,
      redirects,
      https: url.protocol === "https:",
      contentType,
      body: text,
      bytes,
      truncated,
      ttfbMs,
      totalMs: Date.now() - started,
    };
  }
}

/**
 * The homepage, preferring https and falling back to http once.
 *
 * A site reachable only over http is a real trust and ranking problem, so the
 * fallback records what happened instead of hiding it.
 */
export async function fetchHomepage(
  input: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<{
  page: FetchedPage;
  requested: URL;
  httpsFailed: boolean;
}> {
  const requested = normaliseDomain(input);

  try {
    return {
      page: await fetchPage(requested, { timeoutMs }),
      requested,
      httpsFailed: false,
    };
  } catch (error) {
    const retriable =
      error instanceof SiteAuditError &&
      (error.kind === "network" || error.kind === "timeout") &&
      requested.protocol === "https:";

    if (!retriable) throw error;

    const overHttp = new URL(requested.href);
    overHttp.protocol = "http:";

    const page = await fetchPage(overHttp, { timeoutMs });
    return { page, requested, httpsFailed: true };
  }
}

/** Best-effort text fetch. Returns null instead of throwing when absent. */
export async function fetchOptional(
  target: URL,
  accept: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<FetchedPage | null> {
  try {
    const page = await fetchPage(target, {
      accept,
      requireOk: false,
      requireHtml: false,
      timeoutMs,
    });
    return page.status >= 200 && page.status < 300 ? page : null;
  } catch {
    return null;
  }
}
