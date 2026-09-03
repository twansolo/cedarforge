/**
 * Facts read out of a page's HTML.
 *
 * ── Why regex and not a parser ───────────────────────────────────────────────
 * A DOM parser would be more correct, and every option costs a dependency this
 * repo does not have. What the Snapshot needs is coarse and forgiving: does a
 * form exist, is there a phone number in a link, is there LocalBusiness markup,
 * is a booking tool linked. Missing an edge case understates a finding, and the
 * tool is built to be honest about what it could not see rather than to be
 * exhaustive. If this ever needs real DOM semantics, that is the moment to add a
 * parser, not before.
 *
 * ── What this cannot see ─────────────────────────────────────────────────────
 * Server-rendered HTML only. A site that renders its content in the browser
 * looks nearly empty here, and `likelyClientRendered` flags that so the findings
 * can say so out loud instead of reporting an absence that is really a blind
 * spot.
 */

export type FormFact = {
  action: string | null;
  method: string;
  /** Input `name` and `type` pairs found inside the form. */
  fields: Array<{ name: string; type: string }>;
  hasEmailField: boolean;
  hasPhoneField: boolean;
  /** True when the shape says search box rather than enquiry. */
  looksLikeSearch: boolean;
  /** Visible text of the submit control, when it has one. */
  submitLabel: string | null;
};

export type PageFacts = {
  title: string | null;
  metaDescription: string | null;
  hasViewport: boolean;
  canonical: string | null;
  h1s: string[];
  h2Count: number;

  forms: FormFact[];
  /** Forms that are not search boxes. */
  enquiryForms: FormFact[];
  telLinks: string[];
  mailtoLinks: string[];

  /** Third-party scheduling tools linked from the page. */
  bookingProviders: string[];
  /** Live chat or messaging widgets detected in markup or scripts. */
  chatWidgets: string[];
  /** Analytics and tracking detected in markup or scripts. */
  analytics: string[];
  /** CRM and marketing platforms detected in markup or scripts. */
  crmPlatforms: string[];
  /** Links to a Google Business Profile or a map. */
  mapLinks: string[];
  socialProfiles: string[];

  /** `@type` values from every parseable JSON-LD block. */
  schemaTypes: string[];
  hasLocalBusinessSchema: boolean;
  hasOrganizationSchema: boolean;
  hasAggregateRating: boolean;
  hasOpeningHoursSchema: boolean;
  hasPostalAddressSchema: boolean;

  /** Street-address-shaped text found in the body. */
  addressText: string | null;
  /** Opening-hours-shaped text found in the body. */
  hoursText: string | null;
  /** Phone numbers found in visible text, whether or not they are linked. */
  phoneNumbers: string[];

  /** Anchors and buttons whose text reads like a call to action. */
  ctaTexts: string[];
  /** Internal links that look like location or service-area pages. */
  locationPageLinks: string[];
  /** Internal links that look like a contact or quote page. */
  contactPageLinks: string[];

  scriptCount: number;
  /** Distinct third-party hosts serving scripts. */
  thirdPartyScriptHosts: string[];
  imageCount: number;
  imagesMissingAlt: number;
  imagesMissingDimensions: number;

  /** Words of visible text, after stripping markup, script, and style. */
  wordCount: number;
  /** True when the markup carries almost no text but plenty of script. */
  likelyClientRendered: boolean;
};

/* -------------------------------------------------------------------------- */
/* Primitives                                                                 */
/* -------------------------------------------------------------------------- */

const BLOCK_PATTERN = /<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1>/gi;
const TAG_PATTERN = /<[^>]+>/g;

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#(\d{2,5});/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    );
}

function textOf(html: string) {
  return decodeEntities(html.replace(TAG_PATTERN, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** All matches of a global pattern's first capture group, trimmed and deduped. */
function captureAll(html: string, pattern: RegExp, limit = 200) {
  const found: string[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(pattern)) {
    const value = match[1]?.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    found.push(value);
    if (found.length >= limit) break;
  }

  return found;
}

/** Reads one attribute out of a single tag's attribute soup. */
function attr(tag: string, name: string) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i"),
  );
  return match ? (match[2] ?? match[3] ?? match[4] ?? "").trim() : null;
}

function metaContent(html: string, nameOrProperty: string) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0];
    const name = attr(tag, "name") ?? attr(tag, "property");
    if (name?.toLowerCase() === nameOrProperty.toLowerCase()) {
      const content = attr(tag, "content");
      if (content) return decodeEntities(content);
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Detection tables                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Substring signatures, matched against the whole document.
 *
 * Deliberately data rather than code: a platform that stops being detected is
 * fixed by editing a line here, and every finding reports which signature fired
 * so a wrong answer is traceable.
 */
const BOOKING_SIGNATURES: Array<[string, string[]]> = [
  ["Calendly", ["calendly.com"]],
  ["Acuity", ["acuityscheduling.com", "squareup.com/appointments"]],
  ["HubSpot Meetings", ["meetings.hubspot.com"]],
  ["Housecall Pro", ["housecallpro.com", "book.housecallpro"]],
  ["ServiceTitan", ["servicetitan.com"]],
  ["Jobber", ["getjobber.com", "clienthub.getjobber"]],
  ["Setmore", ["setmore.com"]],
  ["Square Appointments", ["squareup.com/book"]],
  ["Zoho Bookings", ["zohobookings"]],
  ["Google Calendar booking", ["calendar.app.google"]],
  ["Cal.com", ["cal.com/"]],
  ["Schedulicity", ["schedulicity.com"]],
  ["Vagaro", ["vagaro.com"]],
  ["Mindbody", ["mindbodyonline.com"]],
];

const CHAT_SIGNATURES: Array<[string, string[]]> = [
  ["Intercom", ["intercom.io", "intercomcdn"]],
  ["Drift", ["drift.com", "driftt.com"]],
  ["Tawk.to", ["tawk.to"]],
  ["Tidio", ["tidio.co"]],
  ["LiveChat", ["livechatinc.com"]],
  ["Crisp", ["crisp.chat"]],
  ["Podium", ["podium.com"]],
  ["Birdeye", ["birdeye.com"]],
  ["HubSpot Chat", ["js.usemessages.com"]],
  ["Facebook Messenger", ["connect.facebook.net/en_US/sdk/xfbml.customerchat"]],
];

const ANALYTICS_SIGNATURES: Array<[string, string[]]> = [
  /*
   * A bare "G-" was in this list and matched any document containing those two
   * characters, which is most of them. Signatures have to be specific enough
   * that a match means something.
   */
  ["Google Analytics 4", ["googletagmanager.com/gtag/js", "gtag("]],
  ["Google Tag Manager", ["googletagmanager.com/gtm.js", "gtm.start"]],
  ["Meta Pixel", ["connect.facebook.net", "fbq("]],
  ["Microsoft Clarity", ["clarity.ms"]],
  ["Hotjar", ["hotjar.com"]],
  ["Plausible", ["plausible.io"]],
  ["Fathom", ["usefathom.com"]],
  ["Vercel Analytics", ["/_vercel/insights"]],
  ["CallRail", ["callrail.com"]],
];

const CRM_SIGNATURES: Array<[string, string[]]> = [
  ["HubSpot", ["js.hs-scripts.com", "hsforms.net", "hs-analytics"]],
  ["Salesforce", ["salesforce.com", "pardot.com"]],
  ["Mailchimp", ["mailchimp.com", "list-manage.com"]],
  ["Klaviyo", ["klaviyo.com"]],
  ["ActiveCampaign", ["activehosted.com"]],
  ["Constant Contact", ["constantcontact.com"]],
  ["Zoho", ["zohopublic", "zoho.com/crm"]],
  ["Keap / Infusionsoft", ["infusionsoft.com", "keap.com"]],
  ["GoHighLevel", ["gohighlevel", "leadconnectorhq"]],
];

const SOCIAL_SIGNATURES: Array<[string, string[]]> = [
  ["Facebook", ["facebook.com/"]],
  ["Instagram", ["instagram.com/"]],
  ["LinkedIn", ["linkedin.com/"]],
  ["YouTube", ["youtube.com/", "youtu.be/"]],
  ["Yelp", ["yelp.com/biz"]],
  ["Better Business Bureau", ["bbb.org/"]],
  ["Angi", ["angi.com/", "homeadvisor.com/"]],
  ["Nextdoor", ["nextdoor.com/"]],
];

function detect(
  haystack: string,
  table: Array<[string, string[]]>,
): string[] {
  return table
    .filter(([, needles]) => needles.some((needle) => haystack.includes(needle)))
    .map(([name]) => name);
}

/**
 * Call-to-action detection.
 *
 * An earlier version matched a fixed list of phrases like "get a quote" and
 * "book now", and reported that cedarforge.ai — a page whose buttons read "Start
 * With a Growth Map" and "Request My Growth Map" — had no call to action at all.
 * A false negative here produces a confidently wrong finding, so this now works
 * three ways and treats any of them as evidence:
 *
 *   1. Text that opens with an action verb and is short enough to be a button.
 *   2. A link pointing at a contact, quote, or booking destination, including a
 *      same-page #contact anchor, whatever its wording.
 *   3. The submit control of an enquiry form.
 */
const CTA_VERB_PATTERN =
  /^(?:get|start|book|schedule|request|claim|call|contact|talk|ask|explore|plan|build|grow|see|try|find|reserve|apply|join|download|learn more|let's|lets)\b/i;

const CTA_PHRASE_PATTERN =
  /\b(?:free (?:quote|estimate|consultation|inspection|audit)|get (?:a |an |your )?(?:quote|estimate|pricing|started)|no obligation|talk to (?:us|a)|speak (?:to|with))\b/i;

const CTA_TARGET_PATTERN =
  /^(?:#(?:contact|quote|book|schedule|enquiry|inquiry|get-?started)|(?:https?:)?\/\/[^/]*)?\/?(?:contact|contact-us|get-a-quote|free-quote|request-quote|estimate|free-estimate|quote|book|booking|schedule|appointment|consultation|get-started)(?:\/|$|[?#])/i;

function looksLikeCta(text: string, href: string) {
  const trimmed = text.trim();

  if (trimmed && trimmed.length <= 60) {
    const words = trimmed.split(/\s+/).length;
    if (words <= 7 && CTA_VERB_PATTERN.test(trimmed)) return true;
    if (CTA_PHRASE_PATTERN.test(trimmed)) return true;
  }

  return CTA_TARGET_PATTERN.test(href.trim());
}

const ADDRESS_PATTERN =
  /\b\d{2,6}\s+[A-Z0-9][A-Za-z0-9.'\-]*(?:\s+[A-Za-z0-9.'\-]+){0,5}\s*(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|pkwy|parkway|hwy|highway|ste|suite|unit)\b[^.]{0,60}?\b[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/i;

const CITY_STATE_ZIP_PATTERN =
  /\b([A-Z][a-zA-Z.\-]+(?:\s+[A-Z][a-zA-Z.\-]+){0,3}),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?\b/;

/**
 * Opening hours. A bare "24/7" is deliberately not enough: it appears in
 * marketing copy about coverage far more often than it states trading hours, and
 * matching it was suppressing the missing-hours finding on sites that never
 * publish any.
 */
const HOURS_PATTERN =
  /\b(?:mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?)\s*(?:[-–—]|through|to)\s*(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\b[^.]{0,40}?\d|\bopen 24 hours\b|\bhours of operation\b|\bbusiness hours\b|\b(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?\s*:?\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/i;

const PHONE_PATTERN =
  /(?:\+?1[\s.\-]?)?\(?\b[2-9]\d{2}\)?[\s.\-]\d{3}[\s.\-]\d{4}\b/g;

const LOCATION_PATH_PATTERN =
  /\/(?:locations?|service-areas?|areas?-we-serve|service-area|cities|neighborhoods?|towns?)(?:\/|$|\?)/i;

const CONTACT_PATH_PATTERN =
  /\/(?:contact|contact-us|get-a-quote|free-quote|request-quote|estimate|free-estimate|quote|book|booking|schedule|appointment|consultation)(?:\/|$|\?)/i;

/* -------------------------------------------------------------------------- */
/* Structured data                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Every `@type` in a JSON-LD payload, however it is nested. Sites wrap their
 * markup in `@graph`, arrays, or both, and the shape varies by plugin.
 */
function collectTypes(node: unknown, into: Set<string>, depth = 0) {
  if (depth > 6 || !node) return;

  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, into, depth + 1);
    return;
  }

  if (typeof node !== "object") return;

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === "@type") {
      if (typeof value === "string") into.add(value);
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === "string") into.add(entry);
        }
      }
      continue;
    }
    collectTypes(value, into, depth + 1);
  }
}

/** LocalBusiness and every subtype a small business plugin might emit. */
const LOCAL_BUSINESS_TYPES = new Set(
  [
    "LocalBusiness",
    "HomeAndConstructionBusiness",
    "Plumber",
    "Electrician",
    "HVACBusiness",
    "RoofingContractor",
    "GeneralContractor",
    "HousePainter",
    "Locksmith",
    "MovingCompany",
    "Dentist",
    "Physician",
    "MedicalClinic",
    "MedicalBusiness",
    "HealthAndBeautyBusiness",
    "DaySpa",
    "BeautySalon",
    "ProfessionalService",
    "AccountingService",
    "Attorney",
    "LegalService",
    "InsuranceAgency",
    "RealEstateAgent",
    "FinancialService",
    "AutoRepair",
    "Store",
    "Restaurant",
    "ChildCare",
    "VeterinaryCare",
    "SelfStorage",
    "PestControl",
    "Landscaper",
  ].map((type) => type.toLowerCase()),
);

/* -------------------------------------------------------------------------- */
/* Forms                                                                     */
/* -------------------------------------------------------------------------- */

function extractForms(html: string): FormFact[] {
  const forms: FormFact[] = [];

  for (const match of html.matchAll(
    /<form\b([^>]*)>([\s\S]{0,20000}?)<\/form>/gi,
  )) {
    const attrs = `<form ${match[1] ?? ""}>`;
    const inner = match[2] ?? "";

    const fields: Array<{ name: string; type: string }> = [];
    for (const field of inner.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
      const tag = field[0];
      const kind = (field[1] ?? "input").toLowerCase();
      const type = (attr(tag, "type") ?? (kind === "input" ? "text" : kind))
        .toLowerCase();
      if (type === "hidden" || type === "submit" || type === "button") continue;
      fields.push({ name: attr(tag, "name") ?? "", type });
    }

    const haystack = `${attrs} ${inner}`.toLowerCase();
    const hasEmailField = /type\s*=\s*["']?email|name\s*=\s*["']?[^"'>]*email/i.test(
      haystack,
    );
    const hasPhoneField =
      /type\s*=\s*["']?tel|name\s*=\s*["']?[^"'>]*(phone|tel)/i.test(haystack);

    /*
     * A search box has one text field and search wording. Counting it as an
     * enquiry form would hide the finding we are actually looking for, which is
     * a site with no way to enquire.
     */
    const looksLikeSearch =
      /role\s*=\s*["']?search|type\s*=\s*["']?search|\bname\s*=\s*["']?(s|q|search)["'\s>]/i.test(
        haystack,
      ) ||
      (fields.length <= 1 && !hasEmailField && !hasPhoneField);

    const submitMatch =
      inner.match(/<button\b[^>]*>([\s\S]{0,120}?)<\/button>/i) ??
      inner.match(/<input\b[^>]*type\s*=\s*["']?submit[^>]*>/i);
    const submitLabel = submitMatch
      ? (textOf(submitMatch[1] ?? "") ||
          attr(submitMatch[0], "value") ||
          null)
      : null;

    forms.push({
      action: attr(attrs, "action"),
      method: (attr(attrs, "method") ?? "get").toLowerCase(),
      fields,
      hasEmailField,
      hasPhoneField,
      looksLikeSearch,
      submitLabel,
    });

    if (forms.length >= 25) break;
  }

  return forms;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                               */
/* -------------------------------------------------------------------------- */

export function extractFacts(html: string, pageUrl: string): PageFacts {
  const lower = html.toLowerCase();
  const visible = textOf(html.replace(BLOCK_PATTERN, " "));

  const anchors: Array<{ href: string; text: string }> = [];
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]{0,300}?)<\/a>/gi)) {
    const href = attr(`<a ${match[1] ?? ""}>`, "href");
    if (!href) continue;
    anchors.push({ href, text: textOf(match[2] ?? "") });
    if (anchors.length >= 600) break;
  }

  let base: URL | null = null;
  try {
    base = new URL(pageUrl);
  } catch {
    base = null;
  }

  const internalPaths = new Set<string>();
  for (const { href } of anchors) {
    if (!base) continue;
    try {
      const resolved = new URL(href, base);
      if (resolved.hostname === base.hostname) {
        internalPaths.add(resolved.pathname + (resolved.search ? "?" : ""));
      }
    } catch {
      // Unparseable href, nothing to classify.
    }
  }

  const schemaTypeSet = new Set<string>();
  for (const block of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]{0,60000}?)<\/script>/gi,
  )) {
    const raw = block[1]?.trim();
    if (!raw) continue;
    try {
      collectTypes(JSON.parse(raw), schemaTypeSet);
    } catch {
      // Malformed JSON-LD is common and is not worth failing the audit over.
    }
  }
  const schemaTypes = [...schemaTypeSet];
  const lowerTypes = schemaTypes.map((type) => type.toLowerCase());

  const scripts = [...html.matchAll(/<script\b[^>]*>/gi)];
  const thirdPartyHosts = new Set<string>();
  for (const script of scripts) {
    const src = attr(script[0], "src");
    if (!src || !base) continue;
    try {
      const resolved = new URL(src, base);
      if (resolved.hostname !== base.hostname) {
        thirdPartyHosts.add(resolved.hostname);
      }
    } catch {
      // Relative or malformed src, not third party.
    }
  }

  const images = [...html.matchAll(/<img\b[^>]*>/gi)];
  const forms = extractForms(html);

  const telLinks = anchors
    .filter(({ href }) => href.toLowerCase().startsWith("tel:"))
    .map(({ href }) => href.slice(4).trim())
    .filter(Boolean);

  const mailtoLinks = anchors
    .filter(({ href }) => href.toLowerCase().startsWith("mailto:"))
    .map(({ href }) => href.slice(7).split("?")[0]?.trim() ?? "")
    .filter(Boolean);

  const ctaTexts = [
    ...new Set(
      [
        ...anchors
          .filter(({ text, href }) => looksLikeCta(text, href))
          .map(({ text, href }) => text || `link to ${href}`),
        ...[...html.matchAll(/<button\b[^>]*>([\s\S]{0,160}?)<\/button>/gi)]
          .map((match) => textOf(match[1] ?? ""))
          .filter((text) => looksLikeCta(text, "")),
        ...forms
          .filter((form) => !form.looksLikeSearch && form.submitLabel)
          .map((form) => form.submitLabel as string),
      ].filter((text) => text.length > 1 && text.length <= 80),
    ),
  ].slice(0, 20);

  const addressMatch = visible.match(ADDRESS_PATTERN);
  const cityStateZip = visible.match(CITY_STATE_ZIP_PATTERN);
  const hoursMatch = visible.match(HOURS_PATTERN);

  const wordCount = visible ? visible.split(/\s+/).length : 0;

  return {
    title: html.match(/<title\b[^>]*>([\s\S]{0,300}?)<\/title>/i)
      ? textOf(html.match(/<title\b[^>]*>([\s\S]{0,300}?)<\/title>/i)?.[1] ?? "")
      : null,
    metaDescription: metaContent(html, "description"),
    hasViewport: Boolean(metaContent(html, "viewport")),
    canonical: (() => {
      for (const link of html.matchAll(/<link\b[^>]*>/gi)) {
        if (attr(link[0], "rel")?.toLowerCase() === "canonical") {
          return attr(link[0], "href");
        }
      }
      return null;
    })(),
    h1s: captureAll(html, /<h1\b[^>]*>([\s\S]{0,400}?)<\/h1>/gi, 10).map(textOf),
    h2Count: [...html.matchAll(/<h2\b/gi)].length,

    forms,
    enquiryForms: forms.filter((form) => !form.looksLikeSearch),
    telLinks: [...new Set(telLinks)].slice(0, 10),
    mailtoLinks: [...new Set(mailtoLinks)].slice(0, 10),

    bookingProviders: detect(lower, BOOKING_SIGNATURES),
    chatWidgets: detect(lower, CHAT_SIGNATURES),
    analytics: detect(lower, ANALYTICS_SIGNATURES),
    crmPlatforms: detect(lower, CRM_SIGNATURES),
    mapLinks: anchors
      .map(({ href }) => href)
      .filter((href) =>
        /google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page|maps\.google/i.test(
          href,
        ),
      )
      .slice(0, 5),
    socialProfiles: detect(lower, SOCIAL_SIGNATURES),

    schemaTypes,
    hasLocalBusinessSchema: lowerTypes.some((type) =>
      LOCAL_BUSINESS_TYPES.has(type),
    ),
    hasOrganizationSchema: lowerTypes.includes("organization"),
    hasAggregateRating: lowerTypes.includes("aggregaterating"),
    hasOpeningHoursSchema: lowerTypes.some(
      (type) => type === "openinghoursspecification",
    ),
    hasPostalAddressSchema: lowerTypes.includes("postaladdress"),

    addressText: addressMatch?.[0]?.trim() ?? cityStateZip?.[0]?.trim() ?? null,
    hoursText: hoursMatch?.[0]?.trim() ?? null,
    phoneNumbers: [
      ...new Set(
        (visible.match(PHONE_PATTERN) ?? []).map((value) => value.trim()),
      ),
    ].slice(0, 10),

    ctaTexts,
    locationPageLinks: [...internalPaths]
      .filter((path) => LOCATION_PATH_PATTERN.test(path))
      .slice(0, 20),
    contactPageLinks: [...internalPaths]
      .filter((path) => CONTACT_PATH_PATTERN.test(path))
      .slice(0, 10),

    scriptCount: scripts.length,
    thirdPartyScriptHosts: [...thirdPartyHosts].slice(0, 30),
    imageCount: images.length,
    imagesMissingAlt: images.filter((image) => attr(image[0], "alt") === null)
      .length,
    imagesMissingDimensions: images.filter(
      (image) =>
        attr(image[0], "width") === null && attr(image[0], "height") === null,
    ).length,

    wordCount,
    /*
     * Under 120 words with several scripts is the signature of a shell that
     * fills itself in on the client. Reporting "no content" for one of those
     * would be wrong, so findings check this first and say what they cannot see.
     */
    likelyClientRendered: wordCount < 120 && scripts.length >= 3,
  };
}

/** City and state from address-shaped text, for the local-search finding. */
export function extractLocality(facts: PageFacts) {
  const source = facts.addressText ?? facts.title ?? "";
  const match = source.match(CITY_STATE_ZIP_PATTERN);
  if (!match) return null;
  return { city: match[1] ?? null, state: match[2] ?? null };
}
