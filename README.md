# Cedar Forge.AI

Marketing site for Cedar Forge.AI — AI automation, conversion-focused websites,
and local search systems for businesses in Cedar Rapids, Iowa.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion,
and React Hook Form with Zod validation.

## Local setup

Requires Node.js 20.9+ (developed on 22).

```bash
npm install
cp .env.example .env.local   # optional, see Contact form below
npm run dev
```

The dev server runs at http://localhost:3000. If a server is already running,
Next.js prints the existing URL and PID rather than starting a duplicate.

```bash
npm run build   # production build, runs the TypeScript check
npm run start   # serve the production build
npm run lint    # ESLint
```

## Project structure

The site is a single page today, composed from independent sections so any one
of them can move to its own route without touching the others.

```
src/
├── app/
│   ├── layout.tsx            Fonts, metadata, JSON-LD, header/footer shell
│   ├── page.tsx              Section composition only
│   ├── globals.css           Design tokens, grid utilities, motion policy
│   ├── not-found.tsx
│   ├── robots.ts             Generated robots.txt
│   ├── sitemap.ts            Generated sitemap.xml
│   └── api/contact/route.ts  Contact intake, server-side validation
├── components/
│   ├── layout/               Header, Footer, Logo
│   ├── sections/             Hero, GrowthSystem, ProblemStrip, Services,
│   │                         Outcomes, Process, LocalRoots, ContactForm
│   ├── ui/                   Button, Field, TechnicalLabel, Reveal, WoodGrain
│   └── motion-provider.tsx   Global reduced-motion policy
├── hooks/
│   └── use-active-section.ts Nav position tracking
└── lib/
    ├── site.ts               All copy and content data
    ├── contact-schema.ts     Zod schema shared by client and server
    ├── structured-data.ts    Organization, LocalBusiness, Service JSON-LD
    └── utils.ts
```

Content lives in `src/lib/site.ts`, not inside components. Editing services,
process stages, outcomes, or nav items is a change to that one file. This is
also the seam to swap in a CMS later: replace the exports with async data
fetches and the sections keep working.

### Adding routes

Sections are self-contained and read their own data, so promoting one to a route
is a move rather than a rewrite. Case studies, articles, a client portal, and
per-service pages can be added as new folders under `src/app/` while the home
page keeps its anchors. Update `navigation` in `src/lib/site.ts` and
`src/app/sitemap.ts` when routes are added.

## Design tokens

Brand colors and type scale are Tailwind theme tokens in `src/app/globals.css`,
so they are available as ordinary utilities (`bg-forge-black`, `text-cedar-green`).

| Token             | Value     | Role                                      |
| ----------------- | --------- | ----------------------------------------- |
| Forge Black       | `#0B0E0C` | Foundation surface                        |
| Workshop White    | `#F4F5F1` | Foundation surface and text on dark       |
| Cedar Green       | `#168447` | Primary brand accent                      |
| Signal Green      | `#2BBF69` | Interactive states, live indicators        |
| Cedar Heartwood   | `#A6653A` | Sparing material detail                   |
| Fresh Cut         | `#E5D6C3` | Warm panel surface                        |
| Muted Steel       | `#667068` | Hairlines, borders, decoration            |

Two derived tokens exist for accessibility. `Muted Steel` on `Forge Black` is
3.77:1 and `Workshop White` on `Cedar Green` is 4.33:1, both short of the WCAG
AA 4.5:1 minimum for running text. `--color-steel-text` (`#747D76`) and
`--color-cedar-ink` (`#168045`) are minimal corrections that reach 4.56:1 and are
visually indistinguishable from the source tokens. The brand values themselves
are unchanged and still drive fills, borders, and large display type.

## Typography

Manrope for headlines and body, DM Mono for technical labels and metadata, both
via `next/font/google` with `display: swap`.

Note that the supplied horizontal logo SVG sets its wordmark in Manrope through
a `font-family` attribute. An SVG loaded via `next/image` renders in its own
document and cannot reach the page's webfonts, so it falls back to Arial. The
header therefore pairs the supplied icon mark with live HTML text for the
wordmark, which keeps the brand typeface and stays crisp at small sizes. The
footer uses the full supplied `Cedar-Forge-Logo-Dark.svg` at a size where the
fallback is not noticeable.

## Contact form

Validation runs through one Zod schema (`src/lib/contact-schema.ts`) on both the
client and the server, so a crafted request cannot bypass the browser's checks.
The route handler applies a best-effort in-memory rate limit (5 requests per
minute per IP) — for real protection, put a durable store such as Vercel KV or
the platform WAF in front of it.

Delivery is a single seam, `deliverLead` in `src/app/api/contact/route.ts`.
Configure one of these options with server-only environment variables:

| Variable                                                  | Purpose                                     |
| --------------------------------------------------------- | ------------------------------------------- |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Transactional email via Resend (all three) |
| `CONTACT_WEBHOOK_URL`                                      | JSON POST to a CRM, Zapier, or Make hook   |

With nothing configured the route still validates and logs the submission, then
returns a development response so the form is fully testable. No values are
prefixed `NEXT_PUBLIC_`, so none reach the client bundle.

## Accessibility and motion

- Single `h1`, ordered heading levels, and landmark regions per section.
- Skip link, visible focus rings on every interactive element.
- Mobile menu is a labelled dialog: opens by keyboard, traps focus, closes on
  Escape, and returns focus to its toggle.
- Form fields wire labels, `aria-invalid`, and `aria-describedby` to their error
  messages; errors use `role="alert"` and success uses `role="status"`.
- The growth engine diagram is `aria-hidden` with a text alternative, and its
  labels are real HTML so they stay readable at 375px.
- Reduced motion is handled by `MotionConfig reducedMotion="user"` in
  `MotionProvider` plus a CSS block that neutralises decorative keyframes.
  Content always resolves to its final visible state.

## Deploying to Vercel

1. Push to GitHub, then import the repository at
   [vercel.com/new](https://vercel.com/new). Framework preset, build command, and
   output are detected automatically; no `vercel.json` is needed.
2. Add any contact-form variables under **Settings → Environment Variables** for
   Production and Preview.
3. Add `cedarforge.ai` under **Settings → Domains** and point DNS at Vercel.

`siteConfig.url` in `src/lib/site.ts` is the canonical origin used for
`metadataBase`, Open Graph URLs, the sitemap, and JSON-LD. Change it there if the
domain changes.

## Content not included

The following are deliberately absent because they were not supplied, and
inventing them would be both misleading and an SEO liability: street address,
phone number, founding date, customer counts, awards, reviews, and testimonials.
The outcome figures in the Outcomes section are labelled in the UI as
illustrative discovery-stage targets rather than measured results.

There is no primary (light-surface) horizontal logo in the kit. The supplied
`Cedar-Forge-Logo-Dark.svg` has a baked-in Forge Black artboard, and
`Cedar-Forge-Logo-Stacked.svg` has a baked-in Workshop White one, so both are
locked to a background. Header and footer are dark surfaces, so this is not
currently a constraint. Add `Cedar-Forge-Primary-Logo.svg` to `/public` if a
light-surface lockup is needed later.
