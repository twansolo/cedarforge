/**
 * Places a CRM contact into one of the target verticals.
 *
 * Deliberately explainable rather than clever. Every result carries the
 * evidence that produced it, so the operator can see *why* a contact was called
 * a roofer and correct the keyword list in src/lib/leads/verticals.ts when it
 * gets one wrong. A scoring model that cannot be argued with would be worse
 * here: the list is small and hand-tuned, and a wrong segment sends the wrong
 * pitch.
 *
 * Two passes, in order:
 *
 *   1. Keywords → resolves market *and* vertical.
 *   2. HubSpot `industry` → resolves market only.
 *
 * Anything that survives both is outside the target list, which is a useful
 * answer in itself.
 */

import {
  targetMarkets,
  type TargetMarket,
  type Vertical,
} from "@/lib/leads/verticals";

export type ClassificationSignal = "keyword" | "industry" | "none";

export type LeadClassification = {
  market: TargetMarket | null;
  vertical: Vertical | null;
  signal: ClassificationSignal;
  /** What matched: the keywords hit, or the industry value used. */
  evidence: string[];
};

/** Fields a contact can be classified from. All optional. */
export type ClassifiableContact = {
  company?: string | null;
  website?: string | null;
  jobTitle?: string | null;
  industry?: string | null;
  message?: string | null;
  email?: string | null;
};

const OUTSIDE: LeadClassification = {
  market: null,
  vertical: null,
  signal: "none",
  evidence: [],
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Compiled once per keyword and reused. Rebuilding these on every row would be
 * a few thousand regex compilations per page load for no reason.
 */
const wordPatterns = new Map<string, RegExp>();

function wordPattern(keyword: string) {
  let pattern = wordPatterns.get(keyword);
  if (!pattern) {
    // Bounded on the left, open on the right: "landscap" matches "landscaping".
    pattern = new RegExp(`\\b${escapeRegExp(keyword)}`, "i");
    wordPatterns.set(keyword, pattern);
  }
  return pattern;
}

/** Letters and digits only, for matching against run-together domain names. */
function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Two haystacks, because the two need different matching rules.
 *
 * `text` is prose and proper nouns, where a word boundary keeps "law firm" from
 * firing on "lawn". `slug` is the website host and the company name with every
 * separator stripped, where there are no boundaries to anchor to — "roof" has
 * to match inside "cedarrapidsroofing.com", so that one is a plain substring
 * test. The keyword is stripped the same way before comparing, which is what
 * lets "real estate" match "hawkeyerealestate.com".
 */
function buildHaystacks(contact: ClassifiableContact) {
  const parts = [
    contact.company,
    contact.jobTitle,
    contact.website,
    contact.message,
  ].filter((part): part is string => Boolean(part?.trim()));

  return {
    text: parts.join(" \n "),
    slug: [contact.website, contact.company, emailDomain(contact.email)]
      .filter((part): part is string => Boolean(part?.trim()))
      .map(slugify)
      .join(" "),
  };
}

/**
 * Domain from an email, minus the public suffix. Free-mail domains are dropped:
 * "gmail" would otherwise be a haystack every contact shares, and no keyword
 * should ever be able to match on it.
 */
const FREE_MAIL = new Set([
  "gmail",
  "googlemail",
  "yahoo",
  "hotmail",
  "outlook",
  "live",
  "aol",
  "icloud",
  "me",
  "msn",
  "proton",
  "protonmail",
  "comcast",
  "att",
  "sbcglobal",
  "mchsi",
  "netzero",
]);

function emailDomain(email: string | null | undefined) {
  const domain = email?.split("@")[1];
  if (!domain) return null;
  const label = domain.split(".")[0]?.toLowerCase();
  if (!label || FREE_MAIL.has(label)) return null;
  return label;
}

/** HubSpot enum values, normalised so casing and separators stop mattering. */
function normaliseIndustry(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function classifyContact(
  contact: ClassifiableContact,
): LeadClassification {
  const { text, slug } = buildHaystacks(contact);

  if (text || slug) {
    for (const market of targetMarkets) {
      for (const vertical of market.verticals) {
        const evidence = vertical.keywords.filter((keyword) => {
          if (text && wordPattern(keyword).test(text)) return true;
          const compact = slugify(keyword);
          return Boolean(compact && slug && slug.includes(compact));
        });

        if (evidence.length > 0) {
          return { market, vertical, signal: "keyword", evidence };
        }
      }
    }
  }

  const industry = contact.industry?.trim();
  if (industry) {
    const normalised = normaliseIndustry(industry);
    const market = targetMarkets.find((candidate) =>
      candidate.industries.includes(normalised),
    );

    if (market) {
      return {
        market,
        vertical: null,
        signal: "industry",
        evidence: [industry],
      };
    }
  }

  return OUTSIDE;
}

/** Short, human label for a classification result. */
export function classificationLabel(result: LeadClassification) {
  if (result.vertical) return result.vertical.name;
  if (result.market) return `${result.market.name} (market only)`;
  return "Outside target";
}
