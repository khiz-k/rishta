# Product & design rules (read first)

**Rishta** is a matchmaking app for people who want marriage, not dating, and for the families who
help them. It is built around the **biodata page**, the one-page marriage profile South Asian
diaspora families already write and forward.

- Each evening a candidate reads a small **Folio** of 5-7 complete pages, one at a time.
- They show interest by writing a 40-400 character **note** and pressing their **seal** onto it.
- When the other person says yes, a match (an **Introduction**) is created at once and **both seals
  break together**. The sealed sections (clear photos, full name, workplace, contact) open, and three
  evenings are proposed across both time zones.
- Family takes part in the margin: pencil notes (Proceed · Let's talk · Not for us), usually through
  a private, watermarked WhatsApp link (`/f/[token]`) with no account.
- Only the adult candidate (the household owner) can seal, say yes or close.

Before changing any UI, read **design.md** (the design contract: IA, shell, screens, tokens, type,
motion, the seal) and **spec.md** (features, data model, API, permissions, seed plan). vision.md
holds positioning and pricing. The brand is **Rishta**: "Vow" is retired.

Non-negotiable rules. Do not regress to the template look.

1. **Paradigm**: the biodata page is the one object. The Folio is a paginated reader of complete
   pages, and My Biodata is the same page edited in place. Never build card grids of people, feeds,
   dashboards, stat tiles, kanbans of people or tables of people.
2. **Shell**: no sidebar, ever. There is a slim masthead with exactly **Folio · Letters · My
   Biodata** (text only), which becomes a 56px text-only bottom bar on phones. Settings, Household,
   Credits and Close my search live behind the square avatar tile. `/b/[handle]`,
   `/letters/[letterId]` and `/f/[token]` are chrome-free. Product routes live under
   `app/(authenticated)/(main)/(organizations)/[organizationSlug]/` (household = organization).
3. **Gestures**: a horizontal swipe only turns pages. Nothing is decided by a swipe, drag, heart or
   single tap. Interest is sent only through the `SealComposer`.
4. **Signature**: the seal unlocks at 40 characters and is pressed by a 600ms hold, by holding Enter
   or Space, or by tap-then-confirm. A suggested first line is never sent verbatim. Accepting a
   letter creates the `match` in the same transaction. Both seals break together (320ms), then the
   photos unveil (400ms).
5. **Type**: Tiro Devanagari Hindi (names, headings, notes, letters) plus Anek Latin (values and UI;
   wdth 75 caps for labels), with the named script fallbacks (Tiro Gurmukhi, Bangla, Tamil, Telugu;
   Noto Serif Gujarati; Noto Nastaliq Urdu, RTL). The base is 17px. Never DM Sans, Outfit, Figtree,
   Inter, Playfair or Cormorant.
6. **Colour**: tokens only (`tooling/tailwind/theme.css`). The design is light-first: an ivory page
   on a parchment desk, in ink. Lac seal `#933113` is the only action colour. Accent text uses
   `--seal-ink`. Marigold (`--rule`) appears only in double rules and the seal rim, never as text.
   "Lamp" is the warm sepia dark mode and is never the default. No pink, rose, gradients,
   per-person colours or hard-coded Tailwind palette colours.
7. **Shape**: radius 0 everywhere. The only circle is the `MonogramSeal`. Pages are flat paper with
   1px borders, a 2px offset stack edge and hairline sections. No blurred shadows, glows or
   backdrop blur. Buttons, avatar tile, photos, chips and checkboxes are square; there are no pill
   switches and no round avatars.
8. **Motion**: page turn 180ms; seal press 220ms; break 320ms; unveil 400ms. Nothing else moves
   beyond short fades. No confetti, sounds, springs, staggered reveals, drag tilt or skeleton
   shimmer. Honour `prefers-reduced-motion`.
9. **People are never inventory**: no percentages or compatibility scores, bids, ranks,
   "N people interested", popularity counts, flames or boosts. Fit is 2-6 plain reasons with honest
   gaps ("Not stated on his page"), computed deterministically on the server. A priority note is
   flat, costs 1 credit and is always labelled.
10. **Privacy and consent**:
    - Non-matches only ever receive server-made photo veils, never the clear image.
    - The sealed section opens only inside an Introduction.
    - Blocks hide everything in both directions.
    - Family never reads messages and never acts for the candidate.
    - A page a relative drafted is invisible until the adult candidate claims it (18+).
    - Notification subjects never name anyone.
11. **Copy**: every string goes through i18n (`packages/i18n/translations/*/saas.json`). The voice
    is a discreet family friend ("Opens when you both say yes."). No emoji in UI. No "match",
    "like", "swipe", "boost" or exclamation marks in system copy.
12. **AI**: visible, editable drafts only (biodata drafting, a first-line suggestion, translation
    for family, safety flags to the recipient). AI never decides, sends, scores or rates looks, and
    is never a chatbot or persona. Every AI surface has a working fallback when `OPENAI_API_KEY` is
    not set.

Banned template-isms: `NavBar` sidebar and `AppWrapper`-as-sidebar, `PageHeader` title/subtitle
stacks, `Card` grids for people, `StatsTile`, `rounded-full` buttons, full-screen spinners,
`confirm()` dialogs, the rings logo, the dark default, indigo or rose accents, and the de/es/fr
locale switcher.

---

# claude.md: Rishta

This file tells coding agents what they need to work safely in this repo. The full template coding
guide is **agents.md** (read its sections on oRPC, organization scoping, forms and i18n before
writing code). The product and design rules above override anything generic in it.

## Key files

| Path                                                                                | What it is                                                                                                                                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `design.md`                                                                         | The design contract: principles, IA and route map, shell, key screens, the seal interaction, tokens, type, motion, accessibility, marketing, anti-patterns                        |
| `spec.md`                                                                           | MVP spec: features and acceptance criteria, data model, API surface, AI, notifications, billing, roles, seed plan, migration                                                      |
| `vision.md`                                                                         | Positioning, customer, competitors, pricing rationale, metrics                                                                                                                    |
| `testing.md`                                                                        | Manual checklist for the **previous** ("Vow", swipe) UI. It is stale and must be rewritten against spec.md §14 seed data.                                                         |
| `apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/`          | Household-scoped product routes: Folio, Letters, My Biodata, Begin, Claim, Close, settings                                                                                        |
| `apps/saas/app/(authenticated)/(main)/(links)/`                                     | Chrome-free `/b/[handle]` and `/letters/[letterId]` (to be built)                                                                                                                 |
| `apps/saas/app/(public)/f/[token]/`                                                 | Family link, no account (to be built)                                                                                                                                             |
| `apps/saas/app/(authenticated)/(main)/(account)/`                                   | Legacy product pages (Discover, quiz, profile, interests, matches, chat, shortlist, viewers, activity, premium) that redirect per design.md §3.4, plus account settings and admin |
| `apps/saas/app/layout.tsx`, `apps/saas/config.ts`                                   | Fonts (`next/font/google`), app name, themes                                                                                                                                      |
| `apps/saas/modules/shared/components/AppWrapper.tsx`, `NavBar.tsx`                  | The template sidebar shell, to be replaced by `Masthead` + `BottomBar`                                                                                                            |
| `apps/saas/modules/shared/lib/utils.ts`                                             | `calcAge` (keep, dedupe). `avatarGradient` and `playSound` are to be deleted; `haptic` is for the seal only.                                                                      |
| `apps/saas/modules/shared/lib/supabase.ts`                                          | Current public-bucket photo upload, to be replaced by private signed URLs (`@repo/storage`)                                                                                       |
| `apps/saas/modules/shared/lib/orpc-query-utils.ts`                                  | `orpc` TanStack Query helpers: use these for all client data                                                                                                                      |
| `packages/database/drizzle/schema/postgres.ts`                                      | Drizzle schema. The domain tables are under "Rishta Domain Tables".                                                                                                               |
| `packages/database/prisma/schema.prisma`                                            | Prisma (template tables and the NotificationType enum; keep in sync)                                                                                                              |
| `packages/api/orpc/router.ts`                                                       | Root router                                                                                                                                                                       |
| `packages/api/modules/{profiles,interests,preferences,shortlists,messages,wallet}/` | Existing domain procedures (evolve per spec.md §8)                                                                                                                                |
| `packages/api/modules/organizations/lib/membership.ts`                              | `verifyOrganizationMembership`: call it in every household-scoped procedure                                                                                                       |
| `packages/auth/config.ts`                                                           | Organizations (households) are **off** today. spec.md F1 turns them on.                                                                                                           |
| `packages/payments/config.ts`                                                       | Plans, billed per organization (household)                                                                                                                                        |
| `packages/ai/index.ts`                                                              | `textModel` (Vercel AI SDK, OpenAI)                                                                                                                                               |
| `packages/i18n/translations/en/saas.json`                                           | All saas strings                                                                                                                                                                  |
| `packages/ui/components/`                                                           | shadcn components (`button.tsx` is `rounded-full` today and must become square; `logo.tsx` is the rings and becomes the wordmark)                                                 |
| `packages/notifications/src/catalog.ts`, `packages/mail/emails/`                    | Notification types and email templates                                                                                                                                            |
| `packages/mail/provider/index.ts`                                                   | The mail provider: **Resend** (`./resend`; `RESEND_API_KEY`, sender `MAIL_FROM`). Notifications and the marketing contact form send through `@repo/mail`.                         |
| `tooling/tailwind/theme.css`                                                        | Design tokens: replace them with design.md §7                                                                                                                                     |
| `apps/marketing/`                                                                   | Marketing site: the founders' letter homepage (design.md §15)                                                                                                                     |

## Coding rules

- TypeScript strict. No `any` (the existing pages use `any`, so fix it when you touch them).
  Interfaces over type aliases for object shapes.
- Server Components by default. Add `"use client"` only for interactive islands (the reader, the
  composer, the seal, sheets).
- Every oRPC procedure validates input with zod. Household procedures take `organizationId`, verify
  membership and check the role (spec.md §13). Cross-household pages go through the redaction layer
  (`PageView`), never raw rows.
- Client data goes through oRPC + TanStack Query via `@shared/lib/orpc-query-utils`.
- Forms use react-hook-form + zod (`@repo/ui/components/form`). A field's value is never held in
  `useState`.
- Every user-facing string goes through `next-intl` translations. Nothing is hard-coded in English.
- Style: tabs, formatted with oxfmt, linted with oxlint (`pnpm lint`). Match the surrounding code.
- Tailwind v4 CSS-first tokens only. No hard-coded colours or radii.
- Package manager: **pnpm only** (never npm or yarn).
- Never open, print or copy the local dotenv credential files. Package scripts that need env use
  `dotenv -c -- <cmd>` without naming a file. Reading `process.env.X` in code is fine.

## Verifying changes

- Install when `node_modules` is missing: `pnpm install --prefer-offline`.
- Type-check needs a dummy database URL for `prisma generate`:
  `export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dev`, then one of:
    - `pnpm --filter saas type-check`
    - `pnpm --filter marketing type-check`
    - `pnpm --filter @repo/api type-check`
    - `pnpm --filter @repo/database type-check`
    - `pnpm --filter @repo/ui type-check`
    - everything: `pnpm turbo type-check --continue --concurrency=3`
- There is no local Postgres. Never migrate, push or seed against a database from an agent session.
  Generate migrations and leave them for review.
- Do not commit or push unless asked.
