import type { FetchedPage } from "@/lib/site-audit/fetch";
import type { PageFacts } from "@/lib/site-audit/extract";

/**
 * The three findings.
 *
 * ── Why ordered rules and not a score ────────────────────────────────────────
 * Same reasoning as the lead classifier: the Snapshot promises exactly one
 * finding per area, and a weighted score would have to be reverse-engineered to
 * explain on a call. Instead each area is a list of rules in priority order,
 * first match wins, and every match carries the evidence that produced it. When
 * a finding is wrong, the fix is to move or edit one rule.
 *
 * Rules are ordered by leverage, not by how easy they are to detect: the first
 * rule in each list is the thing most likely to be costing the business money.
 *
 * ── Absence is not always evidence ───────────────────────────────────────────
 * Most rules fire on something missing. That is only trustworthy when the page
 * arrived as server-rendered HTML. If the markup looks like a client-rendered
 * shell, `absenceReliable` is false and the absence rules are skipped in favour
 * of the ones that measure what we did receive, so the tool never claims a site
 * has no contact form when it simply has no HTML yet.
 */

export type FindingKind = "conversion" | "local-search" | "automation";
export type FindingSeverity = "high" | "medium" | "low";

export type Finding = {
  kind: FindingKind;
  /** Rule id, so a wrong call is traceable to the rule that made it. */
  rule: string;
  title: string;
  /** What was observed, in language a business owner would use. */
  detail: string;
  /** What Cedar Forge would do about it. */
  recommendation: string;
  /** Exact observations behind the call. Rendered next to the finding. */
  evidence: string[];
  severity: FindingSeverity;
  /** Starting point for the impact model, when the rule implies one. */
  suggestedHoursPerWeek?: number;
};

export type AuditContext = {
  page: FetchedPage;
  facts: PageFacts;
  /** Contact page, when the homepage linked to one and it was fetched. */
  contact: { url: string; facts: PageFacts } | null;
  /** True when https failed and the site answered over http instead. */
  httpsFailed: boolean;
  robots: { found: boolean; hasSitemapDirective: boolean } | null;
  sitemap: { found: boolean; urlCount: number; locationUrls: number } | null;
};

/** Everything the site offers a visitor who wants to make contact. */
export type IntakeSurface = {
  enquiryFormCount: number;
  /** True when the only enquiry form lives on the contact page. */
  formOnContactPageOnly: boolean;
  /** Field count of the largest enquiry form found. */
  largestFormFields: number;
  telLinks: string[];
  mailtoLinks: string[];
  bookingProviders: string[];
  chatWidgets: string[];
  crmPlatforms: string[];
  analytics: string[];
};

export function summariseIntake(context: AuditContext): IntakeSurface {
  const { facts, contact } = context;
  const contactFacts = contact?.facts;

  const homeForms = facts.enquiryForms;
  const contactForms = contactFacts?.enquiryForms ?? [];
  const allForms = [...homeForms, ...contactForms];

  const merge = (pick: (source: PageFacts) => string[]) => [
    ...new Set([...pick(facts), ...(contactFacts ? pick(contactFacts) : [])]),
  ];

  return {
    enquiryFormCount: allForms.length,
    formOnContactPageOnly: homeForms.length === 0 && contactForms.length > 0,
    largestFormFields: allForms.reduce(
      (most, form) => Math.max(most, form.fields.length),
      0,
    ),
    telLinks: merge((source) => source.telLinks),
    mailtoLinks: merge((source) => source.mailtoLinks),
    bookingProviders: merge((source) => source.bookingProviders),
    chatWidgets: merge((source) => source.chatWidgets),
    crmPlatforms: merge((source) => source.crmPlatforms),
    analytics: merge((source) => source.analytics),
  };
}

/** Page weight in KB, for evidence strings. */
function kb(bytes: number) {
  return `${Math.round(bytes / 1024)} KB`;
}

const GENERIC_TITLES =
  /^(home|homepage|welcome|index|untitled|new page|my site|my blog|website)\b/i;

/* -------------------------------------------------------------------------- */
/* Conversion                                                                 */
/* -------------------------------------------------------------------------- */

export function findConversionProblem(
  context: AuditContext,
  intake: IntakeSurface,
): Finding | null {
  const { facts, page, httpsFailed } = context;
  const absenceReliable = !facts.likelyClientRendered;

  const hasAnyIntake =
    intake.enquiryFormCount > 0 ||
    intake.telLinks.length > 0 ||
    intake.bookingProviders.length > 0;

  // 1. Nothing to convert with at all.
  if (absenceReliable && !hasAnyIntake && intake.mailtoLinks.length === 0) {
    return {
      kind: "conversion",
      rule: "no-intake",
      title: "There is no way to make contact without leaving the site",
      detail:
        "No enquiry form, no tappable phone number, and no booking link were found on the homepage or the contact page. Every visitor who wants to talk has to go find a phone number somewhere else, and most will not.",
      recommendation:
        "Put one primary action on the page — a short form or a tappable number in the header — and make it the same action on every screen size.",
      evidence: [
        "No enquiry form found",
        "No tel: link found",
        "No booking tool linked",
      ],
      severity: "high",
    };
  }

  // 2. Contact depends on the visitor's own email client.
  if (
    absenceReliable &&
    intake.enquiryFormCount === 0 &&
    intake.bookingProviders.length === 0 &&
    intake.mailtoLinks.length > 0
  ) {
    return {
      kind: "conversion",
      rule: "mailto-only",
      title: "Enquiries depend on the visitor opening their own email app",
      detail:
        "The only way to get in touch in writing is a mailto: link. On a phone that hands the visitor a blank email to write themselves, and on a desktop without a mail client configured it does nothing at all. Neither produces a lead you can track.",
      recommendation:
        "Replace the mailto: link with a short form that posts into the CRM, so the enquiry is captured whether or not the visitor finishes writing it.",
      evidence: [
        `mailto: ${intake.mailtoLinks[0]}`,
        "No enquiry form found",
        ...(intake.telLinks.length > 0
          ? [`Phone link present: ${intake.telLinks[0]}`]
          : []),
      ],
      severity: "high",
    };
  }

  // 3. Not usable on a phone.
  if (!facts.hasViewport) {
    return {
      kind: "conversion",
      rule: "no-viewport",
      title: "The page is not set up for phones",
      detail:
        "There is no viewport tag, which means a phone renders the desktop layout zoomed out and the visitor has to pinch and scroll to read anything. Most local searches happen on a phone, so this is the majority of the traffic.",
      recommendation:
        "Rebuild the front end mobile-first. This one is rarely worth patching: a missing viewport usually means the whole template predates responsive design.",
      evidence: ["No <meta name=viewport> tag"],
      severity: "high",
    };
  }

  // 4. Only reachable over http.
  if (httpsFailed || !page.https) {
    return {
      kind: "conversion",
      rule: "no-https",
      title: "The site answers over http, not https",
      detail:
        "Browsers mark this as “Not secure” in the address bar, and they do it right next to the form you want people to fill in. It also costs ranking, since https has been a signal for years.",
      recommendation:
        "Issue a certificate and redirect every http request to https. This is hours of work, not weeks, and it is the cheapest trust win available.",
      evidence: [
        `Final URL: ${page.url}`,
        ...(httpsFailed ? ["https did not respond; http did"] : []),
      ],
      severity: "high",
    };
  }

  // 5. Slow to first byte.
  if (page.ttfbMs >= 1_500) {
    return {
      kind: "conversion",
      rule: "slow-ttfb",
      title: "The page takes too long to start loading",
      detail: `The server took ${(page.ttfbMs / 1000).toFixed(1)} seconds to send the first byte. Nothing renders before that, and visitors on a phone connection start leaving well inside that window.`,
      recommendation:
        "Find whether the delay is hosting, a plugin stack, or an uncached database query, then move the site onto a platform that serves pages from the edge.",
      evidence: [
        `Time to first byte: ${page.ttfbMs} ms`,
        `HTML size: ${kb(page.bytes)}`,
        `Scripts on the page: ${facts.scriptCount}`,
      ],
      severity: "high",
    };
  }

  // 6. Heavy page.
  if (page.bytes >= 900_000 || facts.scriptCount >= 30) {
    return {
      kind: "conversion",
      rule: "page-weight",
      title: "The page carries far more code than it needs",
      detail: `The homepage ships ${kb(page.bytes)} of HTML and ${facts.scriptCount} scripts, ${facts.thirdPartyScriptHosts.length} of them from other companies' servers. Each one is a request that has to finish before the page settles, and every third-party host is a dependency you do not control.`,
      recommendation:
        "Audit what each script is for, drop the ones nobody reads the data from, and defer the rest so the content renders first.",
      evidence: [
        `HTML size: ${kb(page.bytes)}`,
        `Scripts: ${facts.scriptCount}`,
        ...(facts.thirdPartyScriptHosts.length > 0
          ? [`Third-party hosts: ${facts.thirdPartyScriptHosts.slice(0, 4).join(", ")}`]
          : []),
      ],
      severity: "medium",
    };
  }

  /*
   * 7. A phone number printed as text but never linked.
   *
   * Common on sites built before mobile mattered, and it costs the exact
   * visitor most likely to convert: someone on a phone, ready to call, who now
   * has to memorise ten digits and switch apps.
   */
  if (facts.phoneNumbers.length > 0 && intake.telLinks.length === 0) {
    return {
      kind: "conversion",
      rule: "untappable-phone",
      title: "The phone number cannot be tapped on a phone",
      detail: `The number ${facts.phoneNumbers[0]} appears in the page text, but it is not a link. On a phone that means the visitor has to select it or memorise it and dial by hand, and a good share of them simply will not.`,
      recommendation:
        "Make every printed number a tel: link, and put one in the header where it stays reachable as the visitor scrolls.",
      evidence: [
        `Number in text: ${facts.phoneNumbers[0]}`,
        "No tel: link anywhere on the page",
      ],
      severity: "high",
    };
  }

  /*
   * 8. The phone is the only way in.
   *
   * Distinct from the automation finding that follows from the same fact: this
   * is about the visitor who will not call — after hours, at work, or simply
   * unwilling — and has no other option. The automation finding is about the
   * calls that do come in and get missed.
   */
  if (
    absenceReliable &&
    intake.enquiryFormCount === 0 &&
    intake.telLinks.length > 0 &&
    intake.bookingProviders.length === 0
  ) {
    return {
      kind: "conversion",
      rule: "phone-only-intake",
      title: "Calling is the only way to get in touch",
      detail:
        "There is a tappable number but no form and no booking option anywhere on the homepage or the contact page. Every visitor who is browsing after hours, sitting at a desk, or just not ready to talk to somebody has no way to start a conversation, and they are not going to come back later.",
      recommendation:
        "Add a three-field form beside the phone number, so the visitor picks the channel. Keep the number first for the ones who want to call.",
      evidence: [
        `Phone link: ${intake.telLinks[0]}`,
        "No enquiry form on the homepage or contact page",
        "No booking tool linked",
      ],
      severity: "high",
    };
  }

  // 9. Nothing asks for the next step.
  if (absenceReliable && facts.ctaTexts.length === 0) {
    return {
      kind: "conversion",
      rule: "no-cta-language",
      title: "Nothing on the page asks the visitor to do anything",
      detail:
        "No link or button uses language that offers a next step — no quote, no estimate, no booking, no “talk to us”. The intake exists, but the page never points at it, so the visitor has to decide on their own to go looking.",
      recommendation:
        "Write one primary action and repeat it: above the fold, after the proof, and at the end of the page. One action, same words each time.",
      evidence: [
        "No call-to-action wording found in links or buttons",
        `${facts.h2Count} section headings on the page`,
      ],
      severity: "medium",
    };
  }

  // 8. The form asks for too much.
  if (intake.largestFormFields >= 9) {
    return {
      kind: "conversion",
      rule: "form-too-long",
      title: "The enquiry form asks for too much up front",
      detail: `The main form has ${intake.largestFormFields} fields. Every field after the third is another reason to abandon it, and most of what is being asked could be gathered on the call instead.`,
      recommendation:
        "Cut it to name, contact method, and one sentence about the job. Ask for the rest once someone has replied.",
      evidence: [`Largest enquiry form: ${intake.largestFormFields} fields`],
      severity: "medium",
    };
  }

  // 9. Conversions are invisible.
  if (absenceReliable && intake.analytics.length === 0) {
    return {
      kind: "conversion",
      rule: "no-analytics",
      title: "Nothing visible measures whether the site converts",
      /*
       * Hedged for the same reason as the CRM rule: a tag injected by another
       * script after the page loads never appears in the HTML the server sends,
       * so this reports what was visible rather than asserting an absence.
       */
      detail:
        "No analytics or tag manager appears in the HTML the server sends, so there is likely no record of how many visitors arrive, which pages they read, or how many enquire. A tag injected later by another script would not show up here, so this is one to confirm — but if it is right, every change to this site is currently unmeasurable.",
      recommendation:
        "Confirm what is installed, then make sure the enquiry itself is tracked as a conversion, not just pageviews. Without that, no change to this site can be judged.",
      evidence: [
        "No analytics or tag manager in the served HTML",
        `${facts.thirdPartyScriptHosts.length} third-party script host${facts.thirdPartyScriptHosts.length === 1 ? "" : "s"}`,
      ],
      severity: "medium",
    };
  }

  // 10. The page does not say what the business does.
  const title = facts.title?.trim() ?? "";
  const h1 = facts.h1s[0]?.trim() ?? "";

  if (!title || GENERIC_TITLES.test(title) || !h1) {
    return {
      kind: "conversion",
      rule: "weak-positioning",
      title: "The page does not say what the business does or who for",
      detail: title
        ? `The page title reads “${title}”, and ${h1 ? `the headline is “${h1}”` : "there is no H1 headline at all"}. A visitor who lands from a search has to work out whether they are in the right place, and a search engine has nothing to rank.`
        : "The page has no title tag. That is what shows in a search result and a browser tab, so both are currently blank or auto-filled.",
      recommendation:
        "Write a title and a headline that name the service and the service area, in that order, in the words customers use.",
      evidence: [
        title ? `Title: ${title}` : "No <title> tag",
        h1 ? `H1: ${h1}` : "No H1 heading",
      ],
      severity: "medium",
    };
  }

  // 11. Layout shift from unsized images.
  if (facts.imageCount >= 6 && facts.imagesMissingDimensions >= 5) {
    return {
      kind: "conversion",
      rule: "unsized-images",
      title: "Images move the page around while it loads",
      detail: `${facts.imagesMissingDimensions} of ${facts.imageCount} images have no width or height set, so the layout jumps as each one arrives. That is the effect that makes people tap the wrong thing and lose their place.`,
      recommendation:
        "Set explicit dimensions on every image and serve modern formats at the size they actually display.",
      evidence: [
        `${facts.imagesMissingDimensions} of ${facts.imageCount} images without dimensions`,
        ...(facts.imagesMissingAlt > 0
          ? [`${facts.imagesMissingAlt} without alt text`]
          : []),
      ],
      severity: "low",
    };
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Local search                                                               */
/* -------------------------------------------------------------------------- */

/** Signals counted as present or missing, used by the impact estimate. */
export function countLocalSignalsMissing(context: AuditContext) {
  const { facts, sitemap } = context;

  const checks = [
    facts.hasLocalBusinessSchema,
    Boolean(facts.addressText),
    facts.mapLinks.length > 0 || facts.socialProfiles.length > 0,
    Boolean(facts.hoursText) || facts.hasOpeningHoursSchema,
    facts.locationPageLinks.length > 0 || (sitemap?.locationUrls ?? 0) > 0,
    facts.hasAggregateRating,
  ];

  return checks.filter((present) => !present).length;
}

export function findLocalSearchOpportunity(
  context: AuditContext,
): Finding | null {
  const { facts, sitemap, robots } = context;
  const absenceReliable = !facts.likelyClientRendered;

  // 1. No structured data at all.
  if (absenceReliable && !facts.hasLocalBusinessSchema) {
    return {
      kind: "local-search",
      rule: "no-local-business-schema",
      title: "Google is not being told this is a local business",
      detail: facts.hasOrganizationSchema
        ? "The page has Organization markup but no LocalBusiness markup, so there is nothing tying the business to an address, a service area, or opening hours in a form Google reads directly."
        : "There is no LocalBusiness structured data on the page. Google has to infer the address, hours, and service area from prose, which it does unevenly, and the rich result that shows hours and a call button never appears.",
      recommendation:
        "Add LocalBusiness JSON-LD with the address, phone, hours, service area, and the Google Business Profile URL, then confirm it in the Rich Results test.",
      evidence: [
        facts.schemaTypes.length > 0
          ? `Schema found: ${facts.schemaTypes.slice(0, 5).join(", ")}`
          : "No JSON-LD structured data found",
      ],
      severity: "high",
    };
  }

  /*
   * 2. No name, address, phone.
   *
   * Structured data counts. A service-area business with no storefront often
   * publishes its address in JSON-LD and not in prose, deliberately, and calling
   * that "the address is missing" would be wrong. When the markup has it, this
   * drops to the narrower point about the visitor not being able to see it.
   */
  if (absenceReliable && !facts.addressText) {
    const inSchema = facts.hasPostalAddressSchema;

    return {
      kind: "local-search",
      rule: inSchema ? "address-not-in-text" : "no-nap",
      title: inSchema
        ? "The address is in the markup but not on the page"
        : "The address is not on the homepage at all",
      detail: inSchema
        ? "There is a PostalAddress in the structured data, so search engines have it, but no address appears in the page text a visitor reads. That is a deliberate choice for some service-area businesses and an oversight for others — worth confirming which this is."
        : "No street address was found in the page text or in structured data. Consistent name, address, and phone across the site and the directories is still the backbone of local ranking, and it starts with being present on the page people land on.",
      recommendation: inSchema
        ? "If they serve customers at a location, put the address and phone in the footer as text too, matched character for character to the Google Business Profile. If they are service-area only, publish the areas served instead."
        : "Put the full address and phone in the footer of every page as text, matched character for character to the Google Business Profile.",
      evidence: [
        "No street address found in page text",
        inSchema
          ? "PostalAddress present in structured data"
          : "No PostalAddress in structured data",
        facts.phoneNumbers.length > 0
          ? `Phone found: ${facts.phoneNumbers[0]}`
          : "No phone number found in page text",
      ],
      severity: inSchema ? "low" : "high",
    };
  }

  // 3. No link to the Google Business Profile.
  if (absenceReliable && facts.mapLinks.length === 0) {
    return {
      kind: "local-search",
      rule: "no-gbp-link",
      title: "The site never points at the Google Business Profile",
      detail:
        "There is no link to Google Maps or a Business Profile anywhere on the page. That link is how a site tells Google the two are the same business, and it is where reviews get left — which is the part that moves the map ranking.",
      recommendation:
        "Link the profile from the footer and the contact page, then set up a review request that goes out after every completed job.",
      evidence: [
        "No Google Maps or Business Profile link found",
        facts.socialProfiles.length > 0
          ? `Other profiles linked: ${facts.socialProfiles.join(", ")}`
          : "No social or directory profiles linked",
      ],
      severity: "medium",
    };
  }

  // 4. No service-area or location pages.
  if (
    absenceReliable &&
    facts.locationPageLinks.length === 0 &&
    (sitemap?.locationUrls ?? 0) === 0
  ) {
    return {
      kind: "local-search",
      rule: "no-location-pages",
      title: "There are no pages for the towns the business serves",
      detail:
        "No service-area or location pages were found. Every surrounding town someone searches from is a query this site has nothing specific to rank for, so it competes on the strength of one homepage against competitors with a page per town.",
      recommendation:
        "Build a page per real service area with the work done there, the drive time, and local proof. Only for towns actually served — thin duplicated pages are worse than none.",
      evidence: [
        "No /locations or /service-areas paths linked",
        sitemap?.found
          ? `Sitemap lists ${sitemap.urlCount} URLs, none location-shaped`
          : "No sitemap.xml found",
      ],
      severity: "medium",
    };
  }

  // 5. No hours.
  if (absenceReliable && !facts.hoursText && !facts.hasOpeningHoursSchema) {
    return {
      kind: "local-search",
      rule: "no-hours",
      title: "Opening hours are nowhere on the page",
      detail:
        "No hours were found in the text or in structured data. “Open now” is one of the filters people use on a phone, and a business with no hours published is the one that gets skipped at 7pm.",
      recommendation:
        "Publish hours as text and in the LocalBusiness markup, including how after-hours calls are handled.",
      evidence: ["No opening hours found in text or structured data"],
      severity: "medium",
    };
  }

  // 6. No review signal.
  if (absenceReliable && !facts.hasAggregateRating) {
    return {
      kind: "local-search",
      rule: "no-review-signal",
      title: "Reviews are not shown or marked up on the site",
      detail:
        "No rating markup was found, so the star rating that can appear beside a search result is not available. Reviews are also the strongest local ranking factor the business has direct influence over.",
      recommendation:
        "Pull the review feed onto the site, mark it up with AggregateRating, and automate the request that generates new ones.",
      evidence: ["No AggregateRating structured data found"],
      severity: "low",
    };
  }

  // 7. Crawl basics.
  if (!sitemap?.found || !robots?.found) {
    return {
      kind: "local-search",
      rule: "crawl-basics",
      title: "The crawl basics are incomplete",
      detail: `${!robots?.found ? "There is no robots.txt. " : ""}${!sitemap?.found ? "There is no sitemap.xml. " : ""}Neither is a ranking factor on its own, but both are how a crawler finds everything on the site efficiently, and their absence usually means nobody has looked at the technical layer in a long time.`,
      recommendation:
        "Generate a sitemap on build, reference it from robots.txt, and submit it in Search Console.",
      evidence: [
        robots?.found ? "robots.txt found" : "No robots.txt",
        sitemap?.found ? `sitemap.xml: ${sitemap.urlCount} URLs` : "No sitemap.xml",
      ],
      severity: "low",
    };
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* Automation                                                                 */
/* -------------------------------------------------------------------------- */

export function findAutomationOpportunity(
  context: AuditContext,
  intake: IntakeSurface,
): Finding | null {
  const { facts } = context;
  const absenceReliable = !facts.likelyClientRendered;

  const phonePrimary =
    intake.telLinks.length > 0 &&
    intake.enquiryFormCount === 0 &&
    intake.bookingProviders.length === 0;

  const quoteLanguage = facts.ctaTexts.find((text) =>
    /quote|estimate|inspection|pricing/i.test(text),
  );

  // 1. Phone-only intake: every missed call is a lost job.
  if (absenceReliable && phonePrimary) {
    return {
      kind: "automation",
      rule: "missed-call-recovery",
      title: "Missed-call recovery",
      detail:
        "The phone is the only way in. That works while someone is free to answer, and every call that arrives during a job, after hours, or while another call is in progress is a lead the business paid for and never spoke to.",
      recommendation:
        "Automatic text-back on every missed call, with a short qualifying exchange that captures the job and the address, then books or escalates. This is the single fastest payback in the home-services stack.",
      evidence: [
        `Phone link: ${intake.telLinks[0]}`,
        "No enquiry form found",
        "No booking tool linked",
      ],
      severity: "high",
      suggestedHoursPerWeek: 4,
    };
  }

  // 2. A form with nowhere to go.
  if (absenceReliable && intake.enquiryFormCount > 0 && intake.crmPlatforms.length === 0) {
    return {
      kind: "automation",
      rule: "lead-follow-up",
      title: "Lead qualification and follow-up",
      /*
       * Hedged on purpose. A form that posts to the site's own server and writes
       * to a CRM from there is invisible from the outside, so this says what was
       * observed and leaves the conclusion to the conversation.
       */
      detail:
        "There is an enquiry form, and no CRM or marketing platform is visible in the page. When that is the case submissions usually land in an inbox, which makes whoever reads it the routing, the reminder, and the record — worth confirming on the call, because a form that posts server-side would not show here.",
      recommendation:
        "Route submissions into a CRM, acknowledge instantly, qualify with two or three questions, and put every enquiry on a follow-up sequence that stops the moment someone replies.",
      evidence: [
        `${intake.enquiryFormCount} enquiry form${intake.enquiryFormCount === 1 ? "" : "s"} found`,
        "No CRM or marketing platform detected",
        ...(intake.formOnContactPageOnly
          ? ["Form is on the contact page only"]
          : []),
      ],
      severity: "high",
      suggestedHoursPerWeek: 5,
    };
  }

  // 3. Quotes done by hand.
  if (quoteLanguage) {
    return {
      kind: "automation",
      rule: "quote-generation",
      title: "Quote and estimate generation",
      detail: `The site asks visitors to “${quoteLanguage}”, which means every one of those requests currently becomes a quote somebody writes by hand. That is the step where the backlog forms, and where a slow reply loses the job to whoever answered first.`,
      recommendation:
        "Templated quotes generated from the intake answers, priced from a rate card, sent for review rather than written from scratch, then followed up automatically until they are opened.",
      evidence: [
        `Call to action: ${quoteLanguage}`,
        intake.crmPlatforms.length > 0
          ? `CRM present: ${intake.crmPlatforms.join(", ")}`
          : "No CRM detected",
      ],
      severity: "medium",
      suggestedHoursPerWeek: 6,
    };
  }

  // 4. Booking still goes through a person.
  if (absenceReliable && intake.bookingProviders.length === 0) {
    return {
      kind: "automation",
      rule: "self-serve-booking",
      title: "Self-serve booking and reminders",
      detail:
        "No scheduling tool is linked, so appointments are arranged by phone or email exchange. Each one costs a round trip or two of somebody's attention, and no-shows cost the slot as well.",
      recommendation:
        "Publish real availability, let customers book the slot themselves, and send confirmation and reminder messages automatically.",
      evidence: [
        "No booking or scheduling tool linked",
        ...(intake.telLinks.length > 0
          ? [`Phone link: ${intake.telLinks[0]}`]
          : []),
        ...(intake.enquiryFormCount > 0
          ? [`${intake.enquiryFormCount} enquiry form(s) found`]
          : []),
      ],
      severity: "medium",
      suggestedHoursPerWeek: 3,
    };
  }

  // 5. After-hours coverage.
  if (absenceReliable && intake.chatWidgets.length === 0) {
    return {
      kind: "automation",
      rule: "after-hours-capture",
      title: "After-hours enquiry handling",
      detail:
        "Intake and booking are in place, but there is nothing covering the visitor who arrives with a question outside business hours. Those visitors either wait until morning or go to whoever answers tonight.",
      recommendation:
        "An assistant trained on the services, pricing bands, and service area that answers common questions, captures the job, and hands anything unusual to a human the next morning.",
      evidence: [
        "No chat or messaging widget detected",
        ...(intake.bookingProviders.length > 0
          ? [`Booking: ${intake.bookingProviders.join(", ")}`]
          : []),
        ...(intake.crmPlatforms.length > 0
          ? [`CRM: ${intake.crmPlatforms.join(", ")}`]
          : []),
      ],
      severity: "low",
      suggestedHoursPerWeek: 2,
    };
  }

  return null;
}
