# DESIGN.md: Rishta

> The design contract. Every later stage builds from this document. The direction is fixed at
> portfolio level ("The Biodata: read the page, seal it with a note"). The paradigm, navigation,
> typography, palette, shape and signature interaction are decisions, not suggestions. Refine
> details; never swap them.
>
> Sources: `_design-studio/roster/rishta.json` (final direction), `_design-studio/briefs/rishta.json`
> (discovery brief), the existing code at commit `63deca1`, and `spec.md` (the MVP spec).
> Last updated: 2026-09-26.

---

## 0. Decisions at a glance

| Decision   | Rishta                                                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Paradigm   | A paginated document reader plus an in-place editor. The biodata page is the product's one object.                                                                                                                 |
| Home       | **Folio**: today's 5-7 complete pages, one at a time, with "3 of 7" at the stack edge and a Keep · Pass · Write a note bar.                                                                                        |
| Navigation | No sidebar. A slim masthead reading **Folio · Letters · My Biodata**, which becomes a 56px text-only bottom bar on a phone. A square avatar tile holds Settings, Household, Credits and Close my search.           |
| Link pages | Chrome-free `/b/[handle]` (a page), `/letters/[letterId]` (a letter) and `/f/[token]` (the family link, no account needed).                                                                                        |
| Signature  | **Seal with a note. Both seals break together.**                                                                                                                                                                   |
| Type       | Tiro Devanagari Hindi for names, headings and letters. Anek Latin for values and UI, with condensed caps (wdth 75) for labels. Script fallbacks are named per language. 17px base.                                 |
| Colour     | Warm stationery: an ivory page on a parchment desk. Lac-seal red `#933113` is the only action colour. Marigold `#C98A17` appears only in rules and on the seal rim. Light first. "Lamp" is a warm sepia dark mode. |
| Shape      | Radius 0. Flat paper. 1px borders, a 2px offset stack edge and hairline sections. The one curve is the circular monogram seal.                                                                                     |
| Motion     | Page turn 180ms. Seal press 220ms with ink spread. The seal breaks in 320ms and the photo unblurs in 400ms. No confetti, no sound.                                                                                 |
| Voice      | A respected, discreet family friend: "Opens when you both say yes." "Not stated on his page." No percentages.                                                                                                      |
| Name       | **Rishta**. The split "Vow" branding in the saas app and logo is retired (see vision.md).                                                                                                                          |

---

## 1. Design principles

1. **The page is the product.** Everything on screen is a biodata page, a letter attached to a
   page, or a pencil note in a page's margin. Never a card grid, a feed, a table of people, a
   kanban of people, or a dashboard of numbers. If a new feature cannot be expressed as a page, a
   letter or a margin note, it probably does not belong here.
2. **Read slowly, completely and privately.** A small folio arrives each evening. Pages are read one
   at a time, top to bottom, in the traditional section order. Nothing decides by accident: swipes
   only turn pages. Nothing about a woman leaks before she says yes. Photos stay veiled, the sealed
   section stays sealed, her own reading can stay private, and nobody is ever shown how many people
   wrote to her.
3. **A proposal is written, not tapped.** Showing interest costs a real sentence (at least 40
   characters) and a deliberate press of your seal. Answers are kind and final: a decline is a
   soft note, never a red X. Closing a conversation sends a closing note instead of silence.
4. **Family writes in pencil; the candidate holds the seal.** Parents and siblings read, keep pages
   and react in the margin (Proceed · Let's talk · Not for us), usually through a WhatsApp link with
   no account. Only the adult candidate can seal a note, say yes or close. Their consent is always
   visible.
5. **Culture as structure, not costume.** The invocation line, the section order, the family
   section, the page's own script and two time zones on every proposed call carry the culture. No
   mandalas, paisley, gold foil, henna, hearts, rings or Bollywood kitsch.

---

## 2. Context of use

| Who                                                                                                                                 | When and where                                                                                                                                                                                                     | Device and posture                                                                                                       | What the design must do                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Candidate** (26-36, second-generation professional in the US, UK or Canada; also divorced or widowed people in their 30s and 40s) | 9:30-11:30 p.m., in bed or on the sofa, one-handed. Discreet glances at lunch. A longer weekend session on a laptop to write the page.                                                                             | iPhone portrait, 375-430px, often in a dark room. 13-15" laptop at the weekend.                                          | Thumb-zone actions. A Lamp mode that follows the phone at night. Neutral notifications and app icon. No photos in list rows (a coworker may glance). A print-true page for the laptop and for export. |
| **Parent** (usually the mother, 52-68)                                                                                              | Several evenings a week while a search is active, in bursts when a promising proposal arrives. Mostly reached through a link forwarded on WhatsApp. Often on the sofa beside her child, both looking at one phone. | Mid-range Android at 120-130% system font, sometimes with reading glasses. WhatsApp's in-app browser. Sometimes an iPad. | Link pages with no login wall that load light and fast. Type at 130%. Three large square buttons. Her language, clearly labelled as a translation. Nothing that commits by accident.                  |
| **Helper** (sibling, cousin, aunt, community matchmaker)                                                                            | Occasional to weekly. A sibling checks out the other side quietly.                                                                                                                                                 | Phone.                                                                                                                   | A household seat with pencil-note rights and no power to send.                                                                                                                                        |

Shared viewing is a real posture: two people and one screen at arm's length. Type is sized for
it (17px base, 22px on the family link). No gesture on the page makes a decision.

---

## 3. Interaction paradigm & information architecture

### 3.1 Paradigm

- **Reading** means turning pages. The Folio is a stack of complete biodata pages. You scroll a page
  top to bottom and turn to the next one with a horizontal swipe, the ← → keys or the chevrons in
  the margin. Turning a page never answers it.
- **Answering** a page means one of three words: **Keep** (save it for later and for family),
  **Pass** (quietly, with an optional private reason) or **Write a note** (open the seal composer).
- **Writing your own page** happens on that same page, edited in place. What you see is exactly what
  others see, what prints and what exports.
- **Correspondence** is letters attached to pages: a sealed note, the answer, and an Introduction
  letter once both have said yes. It is not an inbox of cards.
- **Family** takes part in the margin. They write pencil notes on a page, in the app or through a
  private link.

### 3.2 Vocabulary (use these words in UI, code comments and copy)

| Word               | Meaning                                                                                                     | Storage (see spec.md)                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Page**           | One candidate's biodata, rendered as a document                                                             | `biodata_profile` (+ `biodata_photo`)         |
| **Household**      | The candidate plus the family helping them (Better Auth organization)                                       | `organization`, `member`, `household_setting` |
| **Folio**          | Today's 5-7 pages for a household, released each evening                                                    | `folio`, `folio_page`                         |
| **Kept pages**     | Pages kept to read again or show family                                                                     | `shortlist`                                   |
| **Note**           | 40-400 characters written to one person, pressed with your seal                                             | `interest.message`                            |
| **Letter**         | A note plus everything that follows it (answer, introduction, correspondence)                               | `interest` (the letter id is the interest id) |
| **Seal**           | The circular monogram on a note and on a page's sealed section. Its states are pending, pressed and broken. | derived                                       |
| **Sealed section** | The lower third of every page: extra photos, full name, employer, contact, exact date and time of birth     | `fieldVisibility` = `sealed`                  |
| **Introduction**   | What a yes creates at once: both seals broken, both sealed sections opened, times proposed                  | `match`, `call_proposal`, `message`           |
| **Pencil note**    | A family or household reaction in a page's margin                                                           | `margin_note`                                 |
| **Family link**    | A private, watermarked, expiring page link for someone without an account                                   | `family_link`                                 |
| **Why this page**  | 2-6 plain reasons a page is in your folio, gaps included. Never a score.                                    | `folio_page.reasons`                          |

### 3.3 Route map

All in-shell product routes are household-scoped under
`apps/saas/app/(authenticated)/(main)/(organizations)/[organizationSlug]/`. Every household has
one candidate. The slug is neutral and never the full name (for example `priya-k3m`).

| URL                                       | File (relative to `apps/saas/app/`)                                  | Screen                                                                                                               | Who                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `/[organizationSlug]`                     | `(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx` | **Folio**: today's pages. `?p=3` holds the position (nuqs).                                                          | household                                                              |
| `/[organizationSlug]/folio/kept`          | `…/[organizationSlug]/folio/kept/page.tsx`                           | **Kept pages**: the same reader over kept pages, with pencil notes                                                   | household                                                              |
| `/[organizationSlug]/letters`             | `…/[organizationSlug]/letters/page.tsx`                              | **Letters**: Waiting for your answer · Introductions · Your sealed notes · Closed                                    | candidate (guardian and family see a privacy note or stage lines only) |
| `/[organizationSlug]/letters/[letterId]`  | `…/[organizationSlug]/letters/[letterId]/page.tsx`                   | **An open letter**: a received note clipped to its page, a sent note, or an **Introduction** with its correspondence | candidate                                                              |
| `/[organizationSlug]/biodata`             | `…/[organizationSlug]/biodata/page.tsx`                              | **My Biodata**: the page edited in place, with the margin (completeness, preview-as, export, photos)                 | candidate, guardian if allowed                                         |
| `/[organizationSlug]/biodata/looking-for` | `…/[organizationSlug]/biodata/looking-for/page.tsx`                  | **Looking for**: non-negotiables as an editable page                                                                 | candidate                                                              |
| `/[organizationSlug]/biodata/readers`     | `…/[organizationSlug]/biodata/readers/page.tsx`                      | **Readers**: who read your page, with the incognito switch                                                           | candidate                                                              |
| `/[organizationSlug]/begin`               | `…/[organizationSlug]/begin/page.tsx`                                | **The first page**: the timeline-first five-step set-up (run once)                                                   | candidate, guardian before claim                                       |
| `/[organizationSlug]/claim`               | `…/[organizationSlug]/claim/page.tsx`                                | **Claim your page**: the candidate confirms a page a relative drafted                                                | invited candidate                                                      |
| `/[organizationSlug]/close`               | `…/[organizationSlug]/close/page.tsx`                                | **Close my search**: engaged, taking a break, or something else                                                      | candidate                                                              |
| `/[organizationSlug]/settings/general`    | existing template route, restyled                                    | Household settings: time zone, folio hour, family language, incognito reading, family-link sharing, discreet email   | candidate                                                              |
| `/[organizationSlug]/settings/members`    | existing template route, restyled                                    | **Household**: members, roles, relation labels ("Ammi"), invitations, what the household can see                     | candidate, guardian (invite only)                                      |
| `/[organizationSlug]/settings/billing`    | existing template route, restyled                                    | **Credits & plan**: Free or Premium, credit balance and ledger, buy credits                                          | candidate, guardian                                                    |

Chrome-free link pages. These live outside the org shell but reuse the same components:

| URL                   | File                                                                                                       | Screen                                                                                              | Access                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `/b/[handle]`         | `(authenticated)/(main)/(links)/b/[handle]/page.tsx`                                                       | A single page with its margin bar and a "← Back" line. The canonical, print-true address of a page. | Signed in. Checks blocks, status and claim. Photos veiled by relationship. |
| `/letters/[letterId]` | `(authenticated)/(main)/(links)/letters/[letterId]/page.tsx`                                               | A letter opened from an email or notification                                                       | Signed in, member of the letter's household with the right to read it      |
| `/f/[token]`          | `(public)/f/[token]/page.tsx` (new route group with its own minimal layout, forced Paper theme, `noindex`) | **Family link**: the page at 130%, in the chosen language, with three square buttons                | Anyone holding a valid, unexpired token. No account.                       |

Account-level routes stay where the template has them, restyled into the new shell:
`/settings/general`, `/settings/security`, `/settings/notifications`, `/settings/billing`
(redirects to the active household's billing), `/admin/*` (plus a new `/admin/reports`),
`/onboarding` (adds "Who is this page for?"), `/new-organization` (reworded as "Start a page for
someone else"), and `/organization-invitation/[invitationId]` (worded as "Join Priya's household",
or as a claim for a candidate invite).

`/` becomes a server redirect to `/[activeOrganizationSlug]`. Organization slugs must never collide
with `b`, `f`, `letters`, `settings`, `admin`, `onboarding`, `new-organization`, `choose-plan`,
`checkout-return`, `organization-invitation`, `login`, `signup`, `verify`, `forgot-password`,
`reset-password`, `api`, `image-proxy`, `begin`, `claim` or `close`. Add them to
`forbiddenOrganizationSlugs`.

### 3.4 Legacy routes (the current `(account)` pages)

| Today                                 | Becomes                                                | How                                           |
| ------------------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `/` Discover                          | `/[slug]` Folio                                        | redirect; the component is rebuilt            |
| `/quiz`                               | `/[slug]/begin`                                        | redirect; the steps and their order are kept  |
| `/profile`, `/profile/edit`           | `/[slug]/biodata`                                      | redirect; one page for reading and editing    |
| `/browse/[userId]`                    | `/b/[handle]`                                          | redirect resolves the handle from the userId  |
| `/interests`, `/matches`, `/messages` | `/[slug]/letters`                                      | redirect                                      |
| `/matches/[userId]` (chat)            | `/[slug]/letters/[letterId]`                           | redirect resolves the letter from the pair    |
| `/shortlist`                          | `/[slug]/folio/kept`                                   | redirect                                      |
| `/preferences`                        | `/[slug]/biodata/looking-for`                          | redirect                                      |
| `/viewers`                            | `/[slug]/biodata/readers`                              | redirect                                      |
| `/activity`                           | `/[slug]/biodata` (completeness moves into the margin) | redirect                                      |
| `/premium`                            | `/[slug]/settings/billing`                             | redirect; the invented statistics are deleted |

### 3.5 Gating, in order

The `[organizationSlug]/layout.tsx` decides; this replaces the client-side gate in
`(account)/layout.tsx`:

1. No household yet → `/onboarding` ("Who is this page for?").
2. The page is `awaiting_claim` and you are the invited candidate → `/[slug]/claim`. Everyone else in
   the household can draft, but the Folio stays locked: "The folio opens when Priya confirms her page."
3. Looking-for not complete → `/[slug]/begin` (the quiz, run once).
4. Page not yet published → `/[slug]/biodata`, with the Publish bar.
5. Otherwise → Folio.

This keeps the existing gate (quiz → biodata → discover), which works well, and adds household and
claim steps in front of it.

---

## 4. App shell & navigation

### 4.1 Desktop and tablet (≥ 768px)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ Rishta                     FOLIO     LETTERS 2     MY BIODATA                      [PS]  │ 48px masthead
├──────────────────────────────────────────────────────────────────────────────────────────┤ 1px --border
│                                    (parchment desk)                                        │
│      ‹ 3 of 7 ›        ┌──────────── 620px page ────────────┐▕▕▕▕   ┌── 280px margin ──┐    │
│      Friday folio      │                                      │      │                   │    │
│                        │                                      │      │                   │    │
```

- **Masthead** (`Masthead`): 48px tall on `--background`, with a 1px `--border` rule below it.
    - Left: the wordmark "Rishta" in Tiro 22px, linking to the Folio.
    - Centre-left: three text links in Anek condensed caps (13px, wdth 75, weight 600, letter-spacing
      0.08em): FOLIO, LETTERS, MY BIODATA.
    - The active link has a 2px `--foreground` underline, square and flush with the rule. It is never
      a pill, never tinted and never has an icon.
    - LETTERS carries a tabular number in `--seal-ink`: letters waiting for your answer plus
      introductions waiting on your move. It is a plain number, not a bubble badge.
    - Right: the **avatar tile** (`AvatarTile`), a 32px square with 1px border showing the user's
      initials in Tiro. The hit area is 44px. It is never a circle and never a photo.
- **Avatar menu** (Radix dropdown, square, flat):
    - _Searching for_: a household switcher, shown only if you belong to more than one household
      (a mother helping two children, or a sibling who is also searching).
    - Settings · Household · Credits · Close my search
    - Appearance: Paper · Lamp · Follow my phone
    - Sign out
- **No sidebar.** `AppWrapper` becomes the masthead shell and `NavBar.tsx` (the 578-line sidebar) is
  retired. The template's `NotificationCenter` bell is not in the masthead: the Letters count and
  discreet email carry notifications.
- Settings pages (account and household) use the same masthead with a thin text sub-nav under it.
  The template's `SettingsMenu` tabs are restyled square.

### 4.2 Phone (< 768px)

```
┌──────────────────────────────────────┐
│ Rishta        Friday folio · 3 of 7 [PS]│  44px top line: wordmark, context, avatar tile
├──────────────────────────────────────┤
│                                      │
│              (the page)              │
│                                      │
├──────────────────────────────────────┤
│  Keep   │   Pass   │  Write a note   │  56px MarginBar (reader screens only)
├──────────────────────────────────────┤
│  Folio  │ Letters 2 │  My Biodata    │  56px BottomBar, text only
└──────────────────────────────────────┘   + env(safe-area-inset-bottom)
```

- **Top line** (44px): the wordmark in Tiro 20px, a context line in Anek 14px ("Friday folio · 3 of 7",
  "Letters", "My Biodata") and the avatar tile.
- **BottomBar** (56px, text only):
    - Three equal cells in Anek 15px, weight 600, wdth 87.5, sentence case (larger than the desktop
      caps, for parents' eyes).
    - The active cell has a 2px `--foreground` rule on its top edge and full ink. Inactive cells use
      `--muted-foreground`.
    - No icons.
- **MarginBar**: on the Folio, Kept pages and `/b/[handle]`, a 56px action bar sits directly above
  the BottomBar. When the reader scrolls down, the BottomBar slides away (180ms) and the MarginBar
  settles to the bottom edge. It comes back on scroll-up or at the end of the page.
- The BottomBar also hides when the soft keyboard is open (composer, editor).
- **Swipes only turn pages.** Horizontal swipes on the page are axis-locked: they count only when
  |dx| > 1.5·|dy| and |dx| > 12px, and they commit at 64px or on a flick. The page follows the finger
  at most 24px, with no tilt and no overlay. There is no swipe-to-decide anywhere.

### 4.3 Chrome-free link pages

```
┌──────────────────────────────────────┐
│ ← Letters                No. 7KQ-2M9 │  44px line: back link (to the referrer or the Folio), page reference
├──────────────────────────────────────┤
│              (the page)              │
├──────────────────────────────────────┤
│  Keep   │   Pass   │  Write a note   │  MarginBar (for signed-in candidates)
└──────────────────────────────────────┘
```

`/f/[token]` has no navigation at all. It shows only a watermark strip and a language row (see 5.9).

### 4.4 Keyboard (desktop)

| Keys                                                | Where             | Does                                                                            |
| --------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------- |
| ← / → (also `[` / `]`)                              | Folio, Kept pages | Previous / next page                                                            |
| `K`                                                 | reader            | Keep (toggle)                                                                   |
| `P`                                                 | reader            | Pass (opens the private-reason slip; Undo stays for 6s)                         |
| `W`                                                 | reader            | Write a note (opens the composer in the margin)                                 |
| `Y`                                                 | reader            | Why this page (focuses the margin reasons, or opens the sheet on small screens) |
| `F`                                                 | reader            | Show my family (create a family link)                                           |
| ↑ / ↓, Enter                                        | Letters list      | Move / open                                                                     |
| Esc                                                 | anywhere          | Close the sheet or composer. Drafts are kept.                                   |
| Tab to the seal, then hold Enter or Space for 600ms | composer          | Seal and send. A short press opens the confirm step (see §6).                   |

No shortcut fires, or calls `preventDefault`, while focus is on a control or a text field (a button,
a link, any ARIA widget role, an input, a textarea, a select, contenteditable) or inside a menu,
listbox, radio group or tab list; the one test is `isInteractiveTarget`
(`apps/saas/modules/shared/lib/interactive-target.ts`). A list's own rows keep ↑ / ↓. Single-letter
shortcuts can be turned off in Settings (WCAG 2.1.4).

---

## 5. Key screens

Every screen below is built from these shared components:

- `apps/saas/modules/biodata/components/`: `BiodataPage`, `PageSection`, `FieldRow`, `EditableField`,
  `InvocationLine`, `VeiledPhoto`, `SealedSection`, `SignerLine`, `VerifiedMark`, `PageRef`
- `apps/saas/modules/folio/components/`: `FolioReader`, `StackEdge`, `FolioCounter`, `MarginBar`,
  `MarginColumn`, `WhyThisPageSheet`, `PassSlip`, `FolioEndSlip`
- `apps/saas/modules/letters/components/`: `SealComposer`, `MonogramSeal`, `NoteSlip`, `LetterList`,
  `LetterRow`, `IntroductionLetter`, `ProposeThreeTimes`, `Correspondence`, `CloseKindly`,
  `PriorityLabel`, `SafetyNote`
- `apps/saas/modules/household/components/`: `HouseholdMembers`, `ClaimPage`, `PencilNote`,
  `FamilyLinkDialog`
- `apps/saas/modules/family/components/` (the public link): `FamilyLinkPage`, `FamilyReactions`,
  `LanguageRow`, `Watermark`
- `apps/saas/modules/shared/components/`: `Masthead`, `BottomBar`, `AvatarTile`, `PaperSkeleton`,
  `PaperSlip` (in place of toasts and empty-state cards)

### 5.1 Folio (home): `/[organizationSlug]`

**Purpose.** Read today's 5 (Free) or 7 (Premium) complete pages one at a time, and answer each one
without pressure.

**Phone**

```
┌──────────────────────────────────────┐
│ Rishta        Friday folio · 3 of 7 [PS]│
├──────────────────────────────────────┤▕▕▕▕  2px stack edges: pages 4-7 remain
│ ════════════════════════════════════ │  double marigold rule (1px + 2px gap + 1px)
│          ॥ श्री गणेशाय नमः ॥            │  invocation line (optional; in its own script)
│                                      │
│ Arjun Mehta             ┌──────────┐ │  name: Tiro 30/36 on phone (34/40 desktop)
│ 32 · 5′10″ · Toronto    │▒▒▒▒▒▒▒▒▒▒│ │  photo box: 30% of page width, veiled
│ Page written by Arjun   │▒ veiled ▒│ │
│ ▣ Verified phone        └──────────┘ │
│                                      │
│ Personal ─────────────────────────── │  section head: Tiro 20/26 + hairline
│ BORN            June 1994            │  label: Anek wdth 75 caps 12/16 · value: Anek 17/26
│ HEIGHT          5′10″ (178 cm)       │
│ MARRIED BEFORE  Never married        │
│ LANGUAGES       Punjabi, Hindi, English│
│ FAITH           Hindu                │
│ Education & work ─────────────────── │
│ EDUCATION       Doctor of Medicine   │
│ WORK            Family physician     │
│ Family ───────────────────────────── │
│ FATHER          Retired civil engineer│
│ MOTHER          Schoolteacher        │
│ SIBLINGS        One sister, married  │
│ FAMILY          Nuclear · moderate   │
│ NATIVE PLACE    Ludhiana, Punjab     │
│ Lifestyle ────────────────────────── │
│ DIET            Vegetarian           │
│ About ────────────────────────────── │
│ I'm a family physician in Scarborough│  Anek 17/26
│ and the one who cooks on Sundays…    │
│ Looking for ──────────────────────── │
│ Hoping to marry within a year.       │
│ Sealed ───────────────────────────── │
│     (◌)   Photos, full name, work-   │  pending MonogramSeal (outline)
│           place and contact open when│
│           you both say yes.          │
│ No. 7KQ-2M9 · updated 21 Sep         │  PageRef: Anek 13 tabular, muted
├──────────────────────────────────────┤
│ Why this page: you both hope to    ▴ │  44px sheet handle, first reason inline
│ marry within a year.                 │
├──────────────────────────────────────┤
│  Keep   │   Pass   │  Write a note   │  "Write a note" is the only --primary fill
├──────────────────────────────────────┤
│  Folio  │ Letters 2 │  My Biodata    │
└──────────────────────────────────────┘
```

**Desktop**

```
┌ masthead ──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                  │
│   ‹  3 of 7  ›    ┌─────────────────────── 620px ───────────────────────┐▕▕▕▕  ┌── 280px ───────┐ │
│   Friday folio    │ ═══════════════════════════════════════════════════ │      │ WHY THIS PAGE   │ │
│   Kept 1 · Wrote 1│              ॥ श्री गणेशाय नमः ॥                    │      │ ✓ You both hope │ │
│                   │ Arjun Mehta                          ┌───────────┐  │      │   to marry      │ │
│                   │ 32 · 5′10″ · Toronto, Ontario        │  veiled   │  │      │   within a year.│ │
│                   │ Page written by Arjun himself        │  photo    │  │      │ ✓ Vegetarian,   │ │
│                   │ ▣ Verified phone                     └───────────┘  │      │   as you are.   │ │
│                   │ Personal ─────────────────────────────────────────  │      │ ~ He'd rather   │ │
│                   │ …                                                   │      │   not relocate; │ │
│                   │ Sealed ───────────────────────────────────────────  │      │   you're in     │ │
│                   │   (◌) Opens when you both say yes.                  │      │   Edison.       │ │
│                   │ No. 7KQ-2M9 · updated 21 Sep                        │      │ ? Community:    │ │
│                   └──────────────────────────────────────────────────────┘      │   not stated on │ │
│                                                                                  │   his page.     │ │
│                                                                                  │ PENCIL NOTES    │ │
│                                                                                  │ Ammi · Let's    │ │
│                                                                                  │ talk. "Ask about│ │
│                                                                                  │ the hospital."  │ │
│                                                                                  │ [ Keep ][ Pass ]│ │
│                                                                                  │ [ Write a note ]│ │
│                                                                                  │ Show my family  │ │
│                                                                                  └─────────────────┘ │
```

- **Components**: `FolioReader`, `BiodataPage` (read mode), `StackEdge`, `FolioCounter`, `MarginBar`
  (phone) or `MarginColumn` (desktop), `WhyThisPageSheet`, `PassSlip`, `FolioEndSlip`, `SealComposer`.
- **Data**: `folio.today` returns the release date, the next release time, the pages (redacted for a
  stranger), each page's state, `seenBefore`, fit reasons and pencil notes. It never returns a score.
- **Primary action**: Write a note. Keep and Pass are secondary.
    - Keep toggles in place ("Kept ✓") and never turns the page.
    - Pass turns to the next page and leaves a slip, "Passed quietly. Undo", for 6 seconds, with "Add
      a private reason" (Timeline · Distance · Family · Faith · Lifestyle · Not the right feeling ·
      Other). The reason is never shown to anyone else.
- **Loading**: `PaperSkeleton`: the page outline, the double rule and six hairline sections with
  faint label bars. It appears after 150ms so fast loads never flash. No spinner and no shimmer. The
  current full-screen spinner gate is removed.
- **Empty (nothing meets your non-negotiables today)**: a `PaperSlip` reading "No new pages meet your
  non-negotiables today. Your next folio arrives tomorrow evening." with the link "Look again at what
  you're looking for".
- **Before the first release**: "Your first folio arrives this evening at 7."
- **End of the folio**: `FolioEndSlip` in Tiro 18/28: "That's today's folio. The next arrives
  tomorrow evening." Under it, "You kept 2 pages · wrote to 1" linking to Kept pages, and "Passed
  pages" (today's passes, each with Undo). No streaks, no "come back tomorrow" pressure.
- **A page closes mid-read** (blocked, paused, closed): the page is replaced by the slip "This page has
  been closed by its family." The counter keeps its place.
- **Seen before**: a small caps line above the name: "YOU'VE SEEN THIS PAGE BEFORE".
- **Error**: the slip "The folio didn't open. Check your connection and try again." with a
  [Try again] button. Cached pages stay readable.
- **Guardian or family view**: the MarginBar reads [Keep for Priya] [Pencil a note]. Write a note
  never renders for anyone but the candidate. If the page is awaiting its claim, the Folio shows
  "The folio opens when Priya confirms her page."

### 5.2 Why this page: `WhyThisPageSheet`

**Purpose.** Show, in plain words, why a page is in your folio, including what doesn't fit.

```
┌──────────────────────────────────────┐
│ ════════════════════════════════════ │  vaul sheet, square, 1px top border + double rule
│ Why this page                     ✕  │  Tiro 20/26
│                                      │
│ ✓  You both hope to marry within a   │  ✓ fits · ~ gap · ? not stated
│    year.                             │  glyph + words; colour is never the only signal
│ ✓  He's vegetarian, as you are.      │
│ ✓  Hindu, which you listed.          │
│ ~  He'd rather not relocate; you're  │
│    in Edison and open to moving.     │
│ ?  Community: not stated on his page.│
│                                      │
│ These come from your Looking for     │
│ page and his page. Nobody sees a     │
│ score, and he never sees this list.  │
│ Edit what I'm looking for →          │
└──────────────────────────────────────┘
```

- **Data**: `FitReason[]`, each `{ key, verdict: 'fits' | 'gap' | 'unknown', params }`, rendered
  through i18n templates. The reasons are deterministic (spec.md, "Matching").
- Your dealbreakers are listed first. Two to six lines, never a percentage, never a count headline.
- On the phone it snaps to 50% and 90% height. On desktop the same list lives in the margin column.
- On a received letter the reasons are the **recipient's own**: what fits her, gaps included.

### 5.3 Seal composer: `SealComposer` (the behaviour is in §6)

```
┌──────────────────────────────────────┐
│ ════════════════════════════════════ │  vaul sheet (phone) · margin panel (desktop)
│ A note to Arjun                   ✕  │
│                                      │
│ Dear Arjun,                          │  salutation: Tiro italic 18/28, not counted
│ ┌──────────────────────────────────┐ │
│ │ Your page says you cook on        │ │  textarea: Tiro 18/28, 1px --input border
│ │ Sundays. So do I, badly. I'd like │ │
│ │ to know what your family is like  │ │
│ │ in Ludhiana.                      │ │
│ └──────────────────────────────────┘ │
│ A first line, if you'd like one:     │  pencil suggestion (optional, from real overlaps)
│ "We're both Punjabi families hoping  │
│  to marry within a year."  Use it ↵  │
│                                      │
│ 126 of 400 · ready to seal           │  counter; below 40: "14 more characters and you can seal it."
│ ☐ Send as a priority note (1 credit) │  only if credits > 0; explains the label
│                                      │
│          ┌───────┐                   │
│          │  (PS) │  Press and hold   │  MonogramSeal 64px: your initials, lac red, marigold rim
│          └───────┘  to seal and send │
│ — Priya · written by Priya herself   │  signer line preview
└──────────────────────────────────────┘
```

- **States**: locked (under 40 characters, suggestion still verbatim, or contact details in the text),
  ready, holding, pressed (sending), sent, error.
- **Sent**: the sheet closes with the slip "Sealed and sent. He'll read it with your page." The Folio
  page shows your pressed seal with "You wrote to Arjun today", and the MarginBar button becomes "Take
  back my note".

### 5.4 Letters: `/[organizationSlug]/letters`

**Purpose.** Quiet correspondence. Answer what is waiting, oldest first, so nobody waits too long.

**Desktop** (two columns: the list, and the open letter beside its page)

```
┌ masthead ───────────────────────────────────────────────────────────────────────────────┐
├──────────── 360px ──────────────────┬───────────── open letter (5.5 / 5.6) ─────────────┤
│ WAITING FOR YOUR ANSWER             │                                                     │
│ Rahul Patel · 12 days               │                                                     │
│ "Your page mentions your nani's…"   │                                                     │
│ ─────────────────────────────────── │                                                     │
│ Arjun Mehta · PRIORITY NOTE · 1 day │                                                     │
│ "I noticed we both…"                │                                                     │
│ ─────────────────────────────────── │                                                     │
│ Karan B. · ⚑ Take care · 1 day      │                                                     │
│ INTRODUCTIONS                        │                                                     │
│ Harpreet Singh · the seals broke today│                                                   │
│ Nikhil Rao · choose a time          │                                                     │
│ Sameer Joshi · call Thu 8:00 pm     │                                                     │
│ YOUR SEALED NOTES                    │                                                     │
│ Dev Shah · sealed today             │                                                     │
│ Vikram Iyer · sealed 5 days ago     │                                                     │
│ CLOSED (4) ▾                         │                                                     │
└─────────────────────────────────────┴─────────────────────────────────────────────────────┘
```

- **Rows** (`LetterRow`) are text lines between hairlines, not cards:
    - the name in Tiro 18
    - the state in words
    - the note's first line in Tiro italic, `--muted-foreground`
    - disclosed labels in condensed caps: PRIORITY NOTE (in `--seal-ink` with a 1px border), ⚑ Take care
      (a safety flag), and a pencil mark if family reacted
    - **No photos in rows** (discretion at lunch).
- **Order**:
    - Waiting: oldest first. Priority notes are pinned at the top for 48 hours and labelled.
    - Introductions: by next scheduled time, then by the newest message.
    - Sealed notes: newest first. Closed: collapsed.
- **Phone**: one column; a row opens `/[slug]/letters/[letterId]`.
- **Empty**: "No letters yet. When someone writes to you, their note arrives here with their page."
  If there is nothing waiting but there are sealed notes: "Nothing is waiting for your answer."
- **Loading**: hairline row skeletons (static). **Error**: a slip with [Try again].
- **Guardian or family**: "Priya's letters are private to her." If the candidate allows stage lines:
  "Introduced to Harpreet Singh · call booked Thursday." Never the notes and never the messages.

### 5.5 A letter received: `/[organizationSlug]/letters/[letterId]`

**Purpose.** The moment of truth. Judge sincerity and fit in under a minute, with family if she
wants, and answer kindly either way.

```
┌──────────────────────────────────────┐
│ ← Letters          Waiting · 2 days   │
├──────────────────────────────────────┤
│ ┌─ note slip, clipped to the page ─┐ │  NoteSlip overlaps the page top by 12px, 1px border
│ │ PRIORITY NOTE                     │ │  (only when paid for, always labelled)
│ │ Dear Priya,                       │ │  Tiro italic 18/28
│ │ Your page says your family is from│ │  Tiro 18/28
│ │ Jalandhar; mine is from Ludhiana. │ │
│ │ I'd like to hear about the        │ │
│ │ pharmacy you want to open.        │ │
│ │                          (AM)     │ │  his pressed seal, 40px
│ │ — Arjun · written by Arjun himself│ │  SignerLine
│ │ ▣ Verified phone · 24 Sep, 9:12 pm│ │
│ └──────────────────────────────────┘ │
│ ════════════ his page ══════════════ │
│ (BiodataPage, read mode, veiled)     │
├──────────────────────────────────────┤
│ Why this page for you: you both hope ▴│  HER reasons, gaps included
├──────────────────────────────────────┤
│ Decline kindly │ Show my family │ Say yes │  "Say yes" = --primary
└──────────────────────────────────────┘
```

- **Components**: `NoteSlip`, `MonogramSeal` (pressed), `SignerLine`, `VerifiedMark`, `BiodataPage`,
  `WhyThisPageSheet`, `SafetyNote`, `CloseKindly` (decline), `FamilyLinkDialog`.
- **Data**: `interests.get` returns the letter, the sender's page (redacted by relationship: "wrote
  to me" shows photos with `after_note` visibility), her reasons, the signer, any safety flag, and
  pencil notes from her household.
- **Say yes**: a confirm sheet asks "Say yes to Arjun? Both seals break, and your sealed section opens
  to him: photos, full name, workplace and contact." with [Yes, break the seals] and [Not yet]. On
  confirm the Introduction appears in place (§6.4).
- **Decline kindly**: the `CloseKindly` sheet with a pre-written note she can edit ("Thank you for
  writing. I don't think we're the right match, and I wish you well in your search.") or "Let it close
  quietly". Both are final. No red.
- **Show my family**: creates a family link to this page (with the note if she chooses), shared with
  the phone's share sheet or `wa.me`.
- **Safety flag**: a `SafetyNote` above the note: "⚑ Take care: this note asks you to move to
  WhatsApp before you've spoken. Rishta keeps contact sealed until you both say yes." Actions:
  [Report] [Block].
- **States**:
    - Withdrawn meanwhile: "Arjun took back his note."
    - His page closed: "This page has been closed by its family. The letter has closed."
    - Blocked: the page is gone (404 slip).
    - Loading: the note slip outline plus the page skeleton. Error: slip with [Try again].
- **As the sender** (the same route for your own sealed note): your note slip, "Sealed 24 Sep, 9:12
  pm", status in words ("Waiting for her answer"), and [Take back my note].

### 5.6 Introduction (the seals broken): `/[organizationSlug]/letters/[letterId]` once accepted

**Purpose.** Replace a bare email address and an empty chat with one dignified next step: a first
call, at a time that works in both time zones.

```
┌──────────────────────────────────────┐
│ ← Letters                Introduction │
├──────────────────────────────────────┤
│ AN INTRODUCTION · 26 SEP 2026        │  caps label
│ Priya Sharma         Nikhil Rao      │  Tiro 26/32
│   ◖PS◗                 ◖NR◗          │  both MonogramSeals, broken together (§6.4)
│ Edison, NJ · ET      Dallas, TX · CT │
│ ─ Now open to each other ─────────── │
│ ┌──────┐ ┌──────┐   Full name: Nikhil│  photos now clear (unblur 400ms)
│ │photo │ │photo │   Venkata Rao      │
│ └──────┘ └──────┘   Works at: …      │
│                     nikhil@… · +1 …  │  contact, as each side chose to share
│ ─ Three evenings that suit you both ─│
│ Thu 2 Oct  8:00 pm Edison · 7:00 pm Dallas   ☐ │
│ Sat 4 Oct  8:30 pm Edison · 7:30 pm Dallas   ☐ │
│ Sun 5 Oct  7:00 pm Edison · 6:00 pm Dallas   ☐ │
│ [ These work for me ]   Propose three others │
│ ─ Correspondence ─────────────────── │
│ Nikhil · 26 Sep, 9:40 pm              │  Tiro 18/28, no bubbles
│ Thank you for saying yes. Sunday      │
│ evening would suit my parents too.    │
│                       Read 9:52 pm    │  quiet read line under your last message only
│ ┌──────────────────────────────────┐ │
│ │ Write to Nikhil…                  │ │
│ └──────────────────────────────────┘ │
│ [Send]                  Close kindly │
└──────────────────────────────────────┘
```

- **Components**: `IntroductionLetter`, `MonogramSeal` (broken), `VeiledPhoto` (unveiling),
  `ProposeThreeTimes`, `Correspondence`, `CloseKindly`.
- **Data**: `matches.get` returns both participants, the opened sealed sections, contact-sharing state,
  `call_proposal`s, the stage and seal-seen timestamps. Messages come from `messages.list` (polled every
  3s while open, as today, and refetched on focus).
- **Propose three times**:
    - The letter opens with three evenings computed by Rishta: the next three dates where both people's
      local times fall between 6:00 and 10:00 pm.
    - Each person ticks the slots that work. The first slot both tick is booked.
    - "Propose three others" opens a day row (7 square day cells) and 30-minute time rows, each labelled
      in both time zones. The proposer's three are assumed to work for them; the other person picks one.
    - Booked: "Booked: Thursday 2 October, 8:00 pm Edison · 7:00 pm Dallas. We've emailed you both a
      calendar invite." No phone number changes hands unless each person chooses to share one.
- **Families step**: later in the letter, "When you're both ready, share a family contact". Each side
  opts in. Both see the contacts only when both have shared.
- **Close kindly**: at the bottom, in ink (not red). The other person sees "Nikhil has decided not to
  continue. He wished you well." followed by the note. The letter moves to Closed for both.
- **States**:
    - Stage lines: "Choose a time" · "Call booked Thu 8:00 pm" · "Families introduced" · "Closed kindly
      on 3 Oct".
    - After 7 quiet days, one pencil line: "It's been a week. Propose a call, or close kindly."
    - Messages loading: hairline skeleton. Send error: the draft stays, with the line "Not sent. [Try
      again]".

### 5.7 My Biodata (the in-place editor): `/[organizationSlug]/biodata`

**Purpose.** Write a page you'd be proud for your parents to forward, on the page itself, exposing no
more than you choose.

```
Desktop
   MARGIN (left 240)       ┌──────────────── 620px page (edit mode) ─────────────┐   MARGIN (right 280)
   SEE IT AS               │ ═══════════════════════════════════════════════════ │   COMPLETENESS
   ▣ You (editing)         │  + Add an invocation line (optional)                │   Personal · 6 of 7
   ☐ A stranger            │ Priya S.┄┄┄┄┄┄┄┄┄┄                 ┌───────────┐    │   Family · 2 of 5
   ☐ After you both say yes│ 29 · 5′4″ · Edison, New Jersey     │ + Add     │    │   About · written
   ☐ On a family link      │ Page written by Priya herself      │  photos   │    │   Looking for · ✓
                           │ Personal ─────────────────────────  └───────────┘   │
   EXPORT                  │ BORN        March 1997┄┄┄┄  · Shown                  │   HELP ME WRITE
   PDF · WhatsApp image    │ FAITH       Hindu┄┄┄┄┄┄┄┄  · Shown                   │   About me
                           │ COMMUNITY   Punjabi┄┄┄┄┄┄  · Matching only           │   About my family
   READERS                 │ Family ───────────────────────────                    │   Looking for
   4 this week →           │ FATHER      Add your father's occupation             │
                           │ …                                                     │   PUBLISH
                           │ Sealed ───────────────────────────                    │   Your page is live.
                           │   (◌) Full name · workplace · phone                   │   Pause my page
                           └───────────────────────────────────────────────────────┘
```

- **Editing**:
    - Every value is an `EditableField`: the value with a 1px dotted `--input` underline.
    - Click or tap edits in place. Text fields become an inline input. Choices open a square option list
      (a popover on desktop, a vaul sheet on the phone).
    - Enter or blur saves (optimistic `profiles.patch`); Esc cancels.
    - A pencil "Saved" mark shows in the margin for 1s.
    - Empty fields show a Tiro italic prompt in `--pencil`: "Add your father's occupation".
- **Visibility per field** (in edit mode only): a three-word square segmented control, Shown · Sealed ·
  Matching only.
    - Defaults: workplace, income, full name, exact birth date, birth time and place, phone → Sealed.
    - Community and faith can be Matching only (special-category data; explicit consent copy in the
      control's help).
- **Photos**:
    - The photo box at 30% of the page width, with up to 5 photos. The photo manager sheet sets each
      photo's visibility:
        - "Clear to everyone"
        - "Clear after a note"
        - "Clear after you both say yes (recommended)" (the default)
    - A new photo keeps its EXIF data stripped (canvas re-encode before upload).
- **Help me write** (AI, when configured):
    - Three short questions and a tone (Warm · Simple · Formal).
    - The draft appears in pencil inside the field, with [Use this draft] and [Try again].
    - It never saves on its own. If it dropped complexion words it says so in the margin: "We left out
      words about complexion."
- **Preview as**: re-renders the page as a stranger (veiled), as someone introduced (unsealed) or as a
  family link (130%, watermark).
- **Export**: PDF (A4, print-true, reference number and a watermark line) and a WhatsApp image (PNG).
- **Primary action**: Publish my page (while a draft). Once live, the margin says "Your page is live"
  and offers "Pause my page".
- **States**:
    - Draft: a sticky line, "Your page is private until you publish it. Still needed: date of birth,
      faith." On the phone the line keeps the words and its action (Publish, Resume, Invite) sits in
      a 56px bar in the bottom stack, in the thumb zone above the BottomBar.
    - Paused: "Your page is paused, so nobody new sees it."
    - Save error: the field stays in edit with "Not saved. [Try again]".
    - Loading: `PaperSkeleton`.
    - A guardian editing (if allowed): each changed field gets a margin mark "Edited by Ammi · Undo".
- **Mobile**: the margins collapse into a "Margin" sheet opened from the top line ("Margin ▾").
  Completeness notes also appear inline as a pencil line under each section head.

### 5.8 Looking for and The first page: `/[organizationSlug]/biodata/looking-for`, `/[organizationSlug]/begin`

**Purpose.** State your non-negotiables honestly, with the marriage timeline first, and edit them
later on a page of their own.

```
The first page (begin): the five existing quiz steps, kept in order, typeset as a letter

┌──────────────────────────────────────┐
│ ════════════════════════════════════ │
│ Before we begin                      │  Tiro 34/40
│ Step 1 of 5 · The timeline           │  caps meta
│                                      │
│ When do you hope to marry?           │  Tiro 20/26
│ ┌──────────────────────────────────┐ │
│ │ Within 3 months                   │ │  square option rows, 56px, 1px border
│ ├──────────────────────────────────┤ │  selected: 2px ink border + ink tick (no fill colour)
│ │ Within 6 months                   │ │
│ ├──────────────────────────────────┤ │
│ │ ✓ Within a year                   │ │
│ ├──────────────────────────────────┤ │
│ │ In two years or more; no rush     │ │
│ └──────────────────────────────────┘ │
│ I'd like to meet   [ a man ] [ a woman ]│
│                                      │
│ [ Back ]                 [ Continue ]│
└──────────────────────────────────────┘

Step 5 · What matters most: the 12-point budget, kept exactly as it works today
│ You have 12 points. You can't max everything.   │
│ Personality & character  ■■■■■■□□□□   6        │  12 ink squares in total; each row up to 10
│ Financial stability      ■■■■□□□□□□   4        │
│ Physical attraction      ■■□□□□□□□□   2        │
│ 0 points left                                   │
```

- **The steps** (order and content kept from `/quiz`):
    1. Timeline (plus who you'd like to meet)
    2. Where: relocation, residency, preferred places
    3. Age, community, education
    4. Faith and diet, each with **Dealbreaker / Nice to have**
    5. What matters most: the 12-point values budget with a hard cap. On touch every square is a
       44px target and a row's ten wrap as two tallies of five (ten 44px squares don't fit a 360px
       phone); with a mouse on a wide screen they stay one row of 28px squares.
- **Changes from today**:
    - Answers are typed choices (square option rows and multi-select chips), not comma-separated text.
    - Diet offers the same values as the page (vegetarian, eggetarian, vegan, Jain vegetarian,
      non-vegetarian, halal), fixing the "halal, vegetarian" mismatch.
    - The step transitions are a 180ms page turn, not a 300ms slide.
- **Finish**: "Now write your page" → `/[slug]/biodata`.
- **Looking for** afterwards: the same content laid out as one editable page. Each row is an
  `EditableField` with a Dealbreaker / Nice to have toggle. A margin note says what changes: "Loosening
  this adds pages to tomorrow's folio, not today's."
- **States**:
    - Cannot continue without a timeline (as today).
    - Values over budget cannot be set (the squares refuse, as the slider cap does today).
    - Save error keeps the step open with "Not saved. [Try again]".
- **Guardian before claim**: the heading reads "Draft what Priya is looking for. She'll confirm it."

### 5.9 Family link: `/f/[token]` (no account)

**Purpose.** Let Ammi read a page in her language on WhatsApp and tell her daughter what she thinks,
in one tap, without installing or learning anything.

```
┌──────────────────────────────────────┐
│ Shared privately with Ammi by Priya  │  Watermark strip: Anek 15, --muted bg
│ Open until Fri 3 Oct · not for       │
│ forwarding                           │
│ English · हिन्दी · اردو · ਪੰਜਾਬੀ ·     │  LanguageRow: each name in its own script
│ ગુજરાતી · বাংলা · தமிழ் · తెలుగు       │
├──────────────────────────────────────┤
│ ═════════════════════════════════════│
│          ॥ श्री गणेशाय नमः ॥            │
│ अर्जुन मेहता                            │  Tiro Devanagari 44/52 (×1.3)
│ ३२ · ५′१०″ · टोरंटो                    │  values: Anek Devanagari 22/32
│ ┌──────────┐                          │
│ │  veiled  │  फ़ोटो दोनों की हाँ के बाद  │
│ └──────────┘                          │
│ परिवार ──────────────────────────────  │  same section order as every page;
│ …                                      │  the family section is complete and large
│ Translated · show original            │  always present on a translated page
│ (a faint diagonal watermark: "For Ammi · from Priya · 26 Sep")
├──────────────────────────────────────┤
│ आप क्या सोचती हैं?                       │
│ ┌──────────────────────────────────┐ │
│ │ Proceed · आगे बढ़ें                │ │  three square buttons, 56px, full width, 1px ink border
│ ├──────────────────────────────────┤ │  tap = saved at once (ink fill + tick)
│ │ Let's talk · बात करते हैं          │ │
│ ├──────────────────────────────────┤ │
│ │ Not for us · हमारे लिए नहीं         │ │
│ └──────────────────────────────────┘ │
│ Add a few words (optional)           │
│ [ Send to Priya ]                    │
│ Report this page                     │
└──────────────────────────────────────┘
```

- **Behaviour**:
    - Server-rendered. The client island is only `FamilyReactions` and `LanguageRow`.
    - Target under 150 KB of JS and CSS, excluding fonts. Only the chosen script's font subset loads
      (`preload: false`).
    - Forced Paper theme, `noindex`, no analytics.
- **Translation**:
    - A cached AI translation of field values and free text, always labelled "Translated · show
      original".
    - Labels come from the human-reviewed `family` i18n bundle.
    - Without an AI key the page shows the original with translated labels and the line "A translation
      isn't available right now."
- **Privacy**:
    - The photo is always veiled.
    - The sealed section shows only "Opens when they both say yes".
    - The received note is included only if Priya ticked "Include his note".
    - The watermark names the recipient and the sharer.
- **After a tap**: "Thank you. Priya will see 'Let's talk' beside the page." She can change it until
  the link closes.
- **Reachable from anywhere**: on the phone, until the three buttons scroll into view, a 56px bar at
  the bottom edge reads "What do you think? ↓" and takes her to them. It only scrolls; nothing is
  answered from it.
- **Expired or revoked**: "This link has closed. Ask Priya to send it again." (Revocation is never
  revealed.)
- **Urdu**: the whole page mirrors (`dir="rtl"`), set in Noto Nastaliq Urdu with a 2.0 line height.
  The photo box moves to the left.
- **Loading**: server-rendered, so there is no skeleton. Errors: "This page couldn't open. Please try
  the link again in a minute."

### 5.10 Kept pages: `/[organizationSlug]/folio/kept`

- **Purpose**: pages kept to read again and to discuss with family. This is the family table in this
  paradigm.
- **Layout**: the same `FolioReader` over kept pages, newest first. The counter reads "Kept · 2 of 5".
  The margin shows every pencil note on that page (Ammi via link, Kabir in the app, your own).
  Your own notes are private notes to self: guardians and family never see them (spec.md §13).
- **Actions**: Write a note · Show my family · Unkeep.
- **Empty**: "No kept pages yet. Keep a page from your folio to read it again or show your family."
- **Loading and error**: as for the Folio.

### 5.11 Household and Claim: `/[organizationSlug]/settings/members`, `/[organizationSlug]/claim`

**Household** (restyled template members page):

```
│ Household ─────────────────────────────────────── │
│ Priya Sharma      The candidate · holds the seal   │
│ Sunita Sharma     Ammi · Guardian                  │
│                   Reads the folio · keeps pages ·  │
│                   pencils notes · edits my page: Off│
│ Kabir Sharma      Bhaiya · Family                  │
│ Invite someone ─────────────────────────────────── │
│ EMAIL  ┄┄┄┄┄┄┄┄┄┄   CALLED  Nani┄┄┄  ROLE [Family ▾]│
│ [ Send invitation ]                                 │
│ What your household can see ────────────────────── │
│ ☑ Read my folio and kept pages                     │  square checkboxes, not switches
│ ☐ Edit my page                                      │
│ ☐ See who I'm introduced to (never my messages)     │
```

- **Roles**: owner = candidate, admin = guardian, member = family. Invitations reuse Better Auth. The
  relation label ("Ammi", "Bhaiya", "Nani") is what pencil notes are signed with.
- **Empty**: "It's just you. Invite family to read your folio and leave pencil notes. They can never
  write to anyone for you."

**Claim**:

```
│ Your mother, Nasreen, has written a page for you.  │  Tiro 26/32
│ Nothing about you is visible to anyone until you   │
│ confirm it.                                        │
│ (her draft of the page, read-only)                 │
│ [ This is me: confirm my page ]                    │  --primary
│ Edit before confirming                              │
│ This isn't something I want                         │  quiet link → a kind note to Nasreen; draft deleted
```

- **Rules**: claiming needs the candidate's own login and verified email, and the date of birth must be
  18 or more years ago. On claim the candidate becomes the owner and the drafter becomes a guardian.
- **States**: expired invite ("Ask Nasreen to send the invitation again"); under 18 (the page cannot be
  claimed or published; a kind, factual message).

### 5.12 Close kindly and Close my search: `CloseKindly`, `/[organizationSlug]/close`

```
Close my search
│ Why are you closing?                               │
│ [ We're engaged ]                                  │  square option rows
│ [ Taking a break ]                                 │
│ [ Something else ]                                 │
│ What happens next ─────────────────────────────── │
│ · Your page is hidden from every folio today.      │
│ · 2 letters waiting for you get a kind answer.     │
│ · Your 1 sealed note is taken back.                │
│ · Your 2 introductions receive your closing note:  │
│   "I've closed my search. Thank you, and I wish    │
│    you well."  (edit)                              │
│ [ Close my search ]                                │  --secondary (ink); a confirm dialog follows
│ Delete everything instead                          │  --destructive link, second confirm
```

- **Engaged**: "Congratulations. We'll close your page kindly." Then an optional "Would you share how
  you met?" and "Know someone who's searching? Send them a page to begin." (the referral moment).
- **Taking a break**: pauses the page (no new folios either way). Letters and introductions stay open.
- **Close kindly** (one letter or introduction): three editable closing notes and a preview of what the
  other person will see.

### 5.13 Readers, Credits & plan, Settings

- **Readers** (`/[slug]/biodata/readers`):
    - Lines: "Harpreet Singh read your page · Tuesday". No photos and no totals headline.
    - A header switch: "Read pages privately: On" ("When this is on, the people whose pages you read
      aren't told"). It is free, as a safety feature.
    - Blocked people never appear.
    - Empty: "Nobody has read your page this week. Pages go out in folios each evening."
- **Credits & plan** (`/[slug]/settings/billing`):
    - The plan in words ("Free: 5 pages each evening, 3 notes a day").
    - Credits: "9 credits", with ledger lines ("25 Sep · a fourth note · −1").
    - [Buy 5 credits · $5] and what credits do ("An extra note on a busy day, or a priority note, which
      is labelled for her and sits at the top of her letters for two days").
    - Premium comparison in two plain columns. No invented statistics and no "Most popular" ribbon.
- **Settings**: the template account pages in the new shell. Adds Appearance (Paper · Lamp · Follow my
  phone), keyboard shortcuts on or off, and discreet email subjects (on by default).

### 5.14 Onboarding: `/onboarding`

```
│ Who is this page for?                              │  Tiro 34/40
│ [ Me ]                                             │
│ [ My son ]      [ My daughter ]                    │
│ [ My brother ]  [ My sister ]                      │
│ [ Someone else in my family ]                      │
│ (if not me)  THEIR FIRST NAME ┄┄┄┄┄┄               │
│ THEIR EMAIL ┄┄┄┄┄┄  So they can confirm the page.  │
│ You can add it later.                              │
│ [ Continue ]                                       │
```

This creates the household (a neutral slug, the time zone from the browser) and goes to
`/[slug]/begin`. If the page is for someone else it notes: "They'll confirm the page before anyone can
see it."

---

## 6. Signature interaction: Seal with a note; both seals break together

### 6.1 Writing

1. **Write a note** opens the `SealComposer`:
    - a vaul sheet at 90% height on the phone, or the margin column on desktop, with the page staying
      readable beside it
    - the salutation "Dear Arjun," set automatically (not counted, not editable)
    - the signer line previewed below: "— Priya · written by Priya herself"
2. The note is **1-3 sentences, 40-400 characters**. The counter is live and polite ("14 more characters
   and you can seal it"), announced through an `aria-live="polite"` region at most once every 2 seconds.
3. **Optional first line**:
    - A pencil suggestion appears under the textarea: "A first line, if you'd like one: …".
    - It is built from real overlaps between the two pages (same timeline, shared language, same diet,
      families from the same region). It comes from `ai.suggestFirstLine`, or from a deterministic
      template when AI is off.
    - "Use it" inserts it into the textarea. **The seal stays locked while the note still contains the
      suggestion verbatim** ("Make the line your own before sealing."). Changing any word unlocks it.
      The server re-checks against the stored `note_suggestion`.
4. **Contact details** (a phone number, an email address, a WhatsApp or Telegram handle, a URL) lock the
   seal with "Contact details open when you both say yes. Remove them to seal." This protects the
   promise of the sealed section and blunts the move-to-WhatsApp scam pattern.
5. **Priority note**:
    - An optional checkbox, "Send as a priority note (1 credit)", shown when the household has credits.
    - The explanation sits beside it: "She'll see it labelled 'Priority note' at the top of her letters
      for two days."
    - No amounts, ranks or competition are ever shown to anyone.

### 6.2 Pressing the seal

The seal (`MonogramSeal`, 64px) shows the candidate's initials in Tiro on a lac-red disc
(`--seal`) with a 2px marigold rim (`--seal-rim`). It unlocks at 40 characters. There are three ways to
press it, all equivalent:

| Input                                                                                                       | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Press and hold** (pointer or touch)                                                                       | `pointerdown` starts a 600ms hold. The seal itself is the progress: the lac ink spreads from the centre of the disc out to the marigold rim (`--dur-hold`, linear), deepening it from 85% to full, so the wax is seen taking the seal. There is no ring, gauge or sweep around it. Releasing early, moving more than 10px or leaving the seal cancels, and the ink eases back in 150ms. At 600ms the monogram **presses in** (§6.3) and the note is sent. |
| **Hold Enter or Space** (keyboard, seal focused)                                                            | Keydown starts the same 600ms ink spread and keyup cancels it. Auto-repeat events are ignored.                                                                                                                                                                                                                                                                                                                                                            |
| **Tap, then confirm** (a short press under 600ms, a click, VoiceOver or TalkBack double-tap, switch access) | The seal does not send. A confirm row replaces the hint: "Seal and send this note to Arjun?" with [Seal and send] (focused) and [Keep writing]. Activating it presses the seal.                                                                                                                                                                                                                                                                           |

- On touch the seal sets `touch-action: none`, `user-select: none` and `-webkit-touch-callout: none` so
  a long press never selects text or opens the iOS callout.
- Accessible name: "Seal and send your note". Description: "Press and hold, or press once and confirm."
- On success, the live region says "Sealed. Your note is on its way."

### 6.3 Motion of the press

| Phase         | Duration | Easing                           | What moves                                                                                                                                                                                                                          |
| ------------- | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hold progress | 600ms    | linear                           | the ink spreads: a full-lac disc scales 0 → 1 from the centre to the marigold rim (`--seal-hold`, set per frame), deepening the disc from `--seal` at 85% to 100%                                                                   |
| Press         | 220ms    | `cubic-bezier(0.2, 0.8, 0.2, 1)` | the monogram presses in: the seal scales 1.04 → 1. After a full hold the ink is already at the rim; pressed from the confirm step, the ink spreads during these 220ms instead (a radial `clip-path` grows 0 → 100% from the centre) |
| Settle        | then     | —                                | on the phone the sheet closes (240ms) and the page shows your pressed seal in the Sealed section with "You wrote to Arjun today"                                                                                                    |
| Haptic        | 10ms     | —                                | one `navigator.vibrate(10)` at the press, where supported, and nowhere else in the product                                                                                                                                          |

There is no sound, no confetti, no auto-advance and no celebration. Sending a proposal is quiet.

### 6.4 Both seals break at once

When the recipient confirms **Say yes**:

1. The server accepts the letter and **creates the Introduction (`match`) in the same transaction**.
   A single accepted letter is a match. This fixes today's bug, where a reverse interest was also
   needed.
2. On her screen, the letter becomes the `IntroductionLetter`. The two seals, hers and his, sit side by
   side and **break together**:
    - 320ms, `cubic-bezier(0.4, 0, 0.2, 1)`
    - each disc splits along a drawn crack into two halves that rotate ∓8° and part by 6px
3. Starting at the break's end, both sealed sections **open**: 400ms ease-out, photos from
   `blur(16px)` to clear (the clear image is fetched only now, with a signed URL) and the sealed veil
   from opacity 1 to 0.
4. His side:
    - If he is looking at the letter, polling picks up the change and he sees the same break live.
    - Otherwise it plays once, the first time he opens the Introduction (`sealsSeenBy…At` is null), 300ms
      after mount.
    - After that the seals are simply shown broken.
    - His email reads "Your letter has an answer". The subject never names anyone and never says yes.
5. The Introduction letter then shows the three proposed evenings across both time zones (§5.6).

### 6.5 Companion move: Show my family

1. From any page (Folio, Kept, a received letter), **Show my family** opens `FamilyLinkDialog`:
    - who it's for (a label such as "Ammi")
    - the language (default: the household's family language)
    - how long it stays open (1, 3 or 7 days)
    - "Include his note" (letters only)
2. It creates a private, expiring link with a watermark and hands it to the phone's share sheet (or a
   `wa.me` link on desktop). The prefilled text is neutral: "Priya would like your thoughts on a
   page: `<link>`".
3. Ammi taps **Proceed**, **Let's talk** or **Not for us**, and adds a few words if she likes.
4. The reaction appears as a **pencil note** in Priya's margin beside that page, signed "Ammi (via
   link)", in Tiro italic `--pencil` with a pencil mark (a tick, a question mark or a strike, always
   with the words).
5. **Only the candidate can say yes.** Family reactions never change a letter's state.

### 6.6 Edge cases

| Situation                                                         | Behaviour                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily limit reached (3 Free, 10 Premium, per household local day) | The seal is replaced by "You've sealed three notes today. Tomorrow evening you can write again, or use a credit now." [Use 1 credit]                                                                                                                                                               |
| Not enough credits for a priority note                            | The checkbox is disabled: "You have no credits." with "Buy credits"                                                                                                                                                                                                                                |
| He already wrote to her and is waiting                            | The composer doesn't open: "Arjun has already written to you. Read his letter." (opens it, where Say yes lives)                                                                                                                                                                                    |
| She already wrote to him                                          | The page shows her pressed seal and "You wrote to Arjun on 24 Sep" with [Take back my note]                                                                                                                                                                                                        |
| His page closed, paused or blocked while she writes               | Server error, then the slip "This page has closed. Your note wasn't sent." The draft is kept.                                                                                                                                                                                                      |
| Network failure after the press                                   | The seal lifts (the press reversed, 150ms) and the error line reads "The note wasn't sent. Your words are saved; press the seal again." Drafts are kept in `localStorage` per household and page.                                                                                                  |
| Double press or double tap                                        | An idempotency key per composer session. The server also keeps the unique `(fromUserId, toUserId)` index.                                                                                                                                                                                          |
| Scrolling during a hold                                           | Moving more than 10px cancels (it was a scroll).                                                                                                                                                                                                                                                   |
| A guardian or family member                                       | The composer and the seal never render. The MarginBar shows guardian actions.                                                                                                                                                                                                                      |
| An unclaimed or unpublished own page                              | Cannot seal; "Publish your page to write notes."                                                                                                                                                                                                                                                   |
| Accepting after he withdrew                                       | "Arjun took back his note before you answered." No match is created.                                                                                                                                                                                                                               |
| Reduced motion                                                    | The ink still spreads during a hold (it's the timer and essential feedback) but nothing scales, and a cancelled hold clears at once. The press is an instant fill. The break is an instant swap to broken halves, and the unblur is instant. The tap-then-confirm path is shown first in the hint. |
| Both press at once (a reverse letter while hers is pending)       | The server treats a reverse letter as "already wrote to you" and returns that state. There is never a duplicate match (unique `pairKey`).                                                                                                                                                          |

---

## 7. Design tokens

These replace the rose tokens in `tooling/tailwind/theme.css`. Variable names match the template.
New tokens must also be mapped in the `@theme` block (for example `--color-seal: var(--seal);`,
`--color-seal-ink: var(--seal-ink);`, `--color-rule: var(--rule);`, `--color-pencil: var(--pencil);`,
`--color-sealed: var(--sealed);`, `--color-warning: var(--warning);`).

```css
@layer base {
	:root {
		/* Paper: an ivory page on a parchment desk */
		--background: #f5efe3; /* the desk */
		--foreground: #1f1b16; /* ink */
		--card: #fffbf3; /* the page */
		--card-foreground: #1f1b16;
		--popover: #fffbf3;
		--popover-foreground: #1f1b16;
		--primary: #933113; /* lac seal: the only action colour */
		--primary-foreground: #ffffff;
		--secondary: #1f1b16; /* ink buttons (the template default variant) */
		--secondary-foreground: #fffbf3;
		--muted: #ede4d3;
		--muted-foreground: #5e554a;
		--accent: #efe6d6; /* hover and pressed paper */
		--accent-foreground: #1f1b16;
		--border: #cdbfa6; /* hairline rules, page edges */
		--input: #8a7b63; /* field boundaries, dotted editable underline (≥ 3:1) */
		--ring: #1f1b16; /* focus: ink */
		--destructive: #6e172b; /* darkest status colour (CVD-safe, see §14) */
		--destructive-foreground: #ffffff;
		--success: #4f6233; /* mehndi green: "accepted", "booked" */
		--success-foreground: #ffffff;
		--highlight: #c98a17; /* marigold: fills and rules only, never text */
		--highlight-foreground: #1f1b16;
		--radius: 0rem;

		/* New for Rishta */
		--warning: #915709; /* lightest status colour (CVD-safe, see §14) */
		--warning-foreground: #ffffff;
		--seal: #933113; /* the monogram disc */
		--seal-ink: #933113; /* accent-coloured TEXT (links, counts, PRIORITY NOTE) */
		--seal-rim: #c98a17;
		--rule: #c98a17; /* the double marigold rule */
		--pencil: #5e554a; /* pencil notes, prompts (paired with Tiro italic) */
		--sealed: #efe6d6; /* the sealed lower third */
		--veil: #d9cdb7; /* photo placeholder under the blur */
		--scrim: rgb(31 27 22 / 0.32); /* flat sheet scrim, no backdrop blur */

		/* Layout */
		--page-width: 620px;
		--margin-width: 280px;
		--masthead-height: 48px;
		--topline-height: 44px;
		--bar-height: 56px;
		--page-pad-x: 20px; /* 48px at ≥ 768px */
		--stack-offset: 2px;

		/* Motion */
		--dur-turn: 180ms;
		--dur-press: 220ms;
		--dur-break: 320ms;
		--dur-unblur: 400ms;
		--dur-hold: 600ms;
		--dur-sheet: 240ms;
		--ease-paper: cubic-bezier(0.2, 0, 0, 1);
		--ease-press: cubic-bezier(0.2, 0.8, 0.2, 1);
		--ease-break: cubic-bezier(0.4, 0, 0.2, 1);

		/* Type (the families come from next/font variables; see §8) */
		--font-size-base: 17px;
	}

	/* Lamp: warm sepia, follows the phone at night. Never the default. Never on /f/. */
	.dark {
		--background: #1a1612;
		--foreground: #efe6d6;
		--card: #25201a;
		--card-foreground: #efe6d6;
		--popover: #25201a;
		--popover-foreground: #efe6d6;
		--primary: #b8401c; /* deeper seal red for lamplight: fills only */
		--primary-foreground: #ffffff;
		--secondary: #efe6d6;
		--secondary-foreground: #1a1612;
		--muted: #2e2821;
		--muted-foreground: #968f84;
		--accent: #2b251e;
		--accent-foreground: #efe6d6;
		--border: #37322c;
		--input: #756c60;
		--ring: #efe6d6;
		--destructive: #e89592;
		--destructive-foreground: #1a1612;
		--success: #83a177;
		--success-foreground: #1a1612;
		--highlight: #a87a2e;
		--highlight-foreground: #1a1612;

		--warning: #e1bb81;
		--warning-foreground: #1a1612;
		--seal: #b8401c;
		--seal-ink: #d9774f; /* #b8401c is 2.91:1 on the Lamp page, so text uses this */
		--seal-rim: #a87a2e;
		--rule: #a87a2e;
		--pencil: #a39c90;
		--sealed: #2b251e;
		--veil: #3a332b;
		--scrim: rgb(0 0 0 / 0.45);
	}
}
```

Font variables set by `next/font` (see §8): `--font-display` (Tiro Devanagari Hindi), `--font-sans`
(Anek Latin, variable wdth + wght) and per-script fallbacks `--font-script-pa`, `--font-script-gu`,
`--font-script-bn`, `--font-script-ta`, `--font-script-te`, `--font-script-ur` and
`--font-script-devanagari-ui` (Anek Devanagari).

**Token rules**

- `text-primary` is never used for text. Accent-coloured text uses `text-seal-ink`, because the Lamp
  primary fails as text. The Button `link` variant switches to `--seal-ink`.
- `--highlight` and `--rule` are never text colours (2.57:1 on the desk).
- No hard-coded colours in components: none of the eight gradient pairs in `avatarGradient`, no
  emerald, violet, amber or rose utility classes, no `bg-white/20`. Everything goes through tokens.
- `apps/saas/config.ts`: `defaultTheme` changes from `"dark"` to `"system"` (the `Theme` type gains
  `"system"`), so "Follow my phone" is the default. With no system preference it resolves to Paper.
  The design is authored and reviewed light-first. `/f/[token]` uses `forcedTheme="light"`, and
  marketing is light only.

---

## 8. Typography

| Face                                                            | next/font/google import                                                                         | Weights / axes                                                                  | Subsets                            | Used for                                                                                                    |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Tiro Devanagari Hindi**                                       | `Tiro_Devanagari_Hindi`                                                                         | 400, normal + italic (the only weight; `font-synthesis: none`, never faux bold) | `latin`, `latin-ext`, `devanagari` | Wordmark, names, section heads, salutations, notes and letters, the folio end slip, Hindi and Marathi pages |
| **Anek Latin**                                                  | `Anek_Latin`                                                                                    | variable wght 100-800, `axes: ["wdth"]` (75-125)                                | `latin`, `latin-ext`               | Field values, all UI text, buttons, labels (wdth 75 caps), tabular numbers                                  |
| Tiro Gurmukhi                                                   | `Tiro_Gurmukhi`                                                                                 | 400 + italic, `preload: false`                                                  | `gurmukhi`                         | Punjabi pages, ੴ                                                                                            |
| Tiro Bangla                                                     | `Tiro_Bangla`                                                                                   | 400 + italic, `preload: false`                                                  | `bengali`                          | Bengali pages                                                                                               |
| Tiro Tamil                                                      | `Tiro_Tamil`                                                                                    | 400 + italic, `preload: false`                                                  | `tamil`                            | Tamil pages                                                                                                 |
| Tiro Telugu                                                     | `Tiro_Telugu`                                                                                   | 400 + italic, `preload: false`                                                  | `telugu`                           | Telugu pages                                                                                                |
| Noto Serif Gujarati                                             | `Noto_Serif_Gujarati`                                                                           | variable, `preload: false`                                                      | `gujarati`                         | Gujarati headings (Tiro has no Gujarati cut)                                                                |
| Noto Nastaliq Urdu                                              | `Noto_Nastaliq_Urdu`                                                                            | variable 400-700, `preload: false`                                              | `arabic`                           | Urdu pages, headings and values, mirrored RTL; also بسم الله الرحمن الرحيم                                  |
| Anek Devanagari / Gurmukhi / Gujarati / Bangla / Tamil / Telugu | `Anek_Devanagari`, `Anek_Gurmukhi`, `Anek_Gujarati`, `Anek_Bangla`, `Anek_Tamil`, `Anek_Telugu` | variable, `preload: false`                                                      | script subset                      | Field values and buttons on pages set in those scripts (the family link, translated pages)                  |

Script selection uses `:lang()` on the page container (`<article lang="pa">`), so the stack switches
per language. Only glyphs actually rendered trigger a font download.

**Scale** (17px base; rem-based so it respects user zoom and Android font scaling)

| Role                                                        | Face        | Size / line                                  | Details                                                |
| ----------------------------------------------------------- | ----------- | -------------------------------------------- | ------------------------------------------------------ |
| Name on a page                                              | Tiro        | 34/40 (30/36 under 400px)                    | −0.005em tracking                                      |
| Page title (Folio end, Before we begin, Introduction names) | Tiro        | 34/40                                        | —                                                      |
| Section head                                                | Tiro        | 20/26                                        | title case, followed by a hairline that fills the line |
| Salutation                                                  | Tiro italic | 18/28                                        | "Dear Priya,"                                          |
| Notes, letters, correspondence, slips                       | Tiro        | 18/28                                        | measure 34-38em                                        |
| Wordmark                                                    | Tiro        | 22/24 (20 on phone)                          | "Rishta"                                               |
| Field value, UI body                                        | Anek        | 17/26, wght 420                              | —                                                      |
| Field label                                                 | Anek        | 12/16, wdth 75, wght 600, uppercase, +0.08em | `--muted-foreground`                                   |
| Masthead links                                              | Anek        | 13/16, wdth 75, wght 600, uppercase, +0.08em | —                                                      |
| Bottom bar, buttons                                         | Anek        | 15/20 and 16/20, wdth 87.5, wght 600         | sentence case                                          |
| Meta, counters, times, reference numbers                    | Anek        | 14/20 and 13/16                              | `font-variant-numeric: tabular-nums`                   |
| Family link                                                 | ×1.3        | names 44/52, values 22/32, buttons 20/24     | —                                                      |
| Urdu pages                                                  | Nastaliq    | +2px, line-height 2.0                        | `dir="rtl"`, the layout mirrors                        |

Retired: DM Sans, Outfit (saas), Figtree (marketing). Never Inter, Playfair or Cormorant.

---

## 9. Shape, elevation and borders

- **Radius 0 everywhere**: pages, buttons, inputs, selects, sheets, dialogs, dropdowns, photos, the
  avatar tile, chips and option rows. The template's `rounded-full` buttons, `rounded-xl` option
  buttons and `rounded-lg` cards all become square.
- **The one curve** is the `MonogramSeal` (and its focus ring). There is no hold ring around it. There are no other
  circles: no round avatars, no pill badges, no switch pills (use square checkboxes), no round icon
  buttons and no progress dots.
- **Page**: `--card` fill, a 1px `--border` edge and a double marigold rule at the top (1px `--rule`,
  a 2px gap, 1px `--rule`).
- **Stack edge**: flat offset edges, no blur:
    - `box-shadow: 2px 2px 0 -1px var(--card), 2px 2px 0 0 var(--border)`
    - one edge per remaining page, up to 3 (2px, 4px, 6px)
- **Sections** are separated by hairlines (1px `--border`). There are no boxes inside the page except
  the photo box, the sealed section (on `--sealed`, with a 1px dashed `--border`) and the note slip.
- **Elevation** has three flat levels:
    1. the desk
    2. the page
    3. sheets, popovers and slips: the paper surface with a 1px `--border` edge, plus a flat `--scrim`
       behind modal sheets
    - No `shadow-*` with blur, no `backdrop-blur`, no ambient glow blobs.
- **Photos**: portrait 4:5 in a square-cornered box with a 1px border. Veiled photos show a server-made
  32px derivative, scaled up under `filter: blur(16px)` on `--veil`. They never use the clear image with
  CSS blur alone.
- **Buttons**:
    - Heights: 44px (default), 56px (MarginBar, family link) and 36px (dense desktop margin only).
    - Primary is a `--primary` fill. Secondary is an ink fill. Outline is a 1px ink border. Ghost is
      text only.
    - Label first; an icon only if it adds meaning.

---

## 10. Motion

| Event                         | Duration               | Easing                           | Property                                                                                             | Reduced motion                  |
| ----------------------------- | ---------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------- |
| Page turn                     | 180ms                  | `--ease-paper`                   | the incoming page `translateX(±24px) → 0` and `opacity 0 → 1`; the outgoing page's opacity goes to 0 | opacity only, 120ms             |
| Swipe follow                  | live                   | —                                | at most 24px translate, no rotation                                                                  | disabled; buttons and keys only |
| Seal hold (ink spread)        | 600ms                  | linear                           | the seal's ink disc scales 0 → 1 to the rim (`--seal-hold`); no ring or sweep                        | kept (essential feedback)       |
| Hold cancel                   | 150ms                  | ease-out                         | the ink eases back to the centre                                                                     | instant                         |
| Seal press                    | 220ms                  | `--ease-press`                   | scale 1.04 → 1 (the monogram presses in); ink spread by `clip-path` only when pressed from confirm   | instant fill                    |
| Seal break                    | 320ms                  | `--ease-break`                   | the halves rotate ∓8° and part 6px; the crack stroke draws                                           | instant swap                    |
| Unveil                        | 400ms, after the break | ease-out                         | photo `blur(16px) → 0`, sealed veil opacity 1 → 0                                                    | instant                         |
| Sheet                         | 240ms                  | `cubic-bezier(0.32, 0.72, 0, 1)` | vaul translateY                                                                                      | opacity 120ms                   |
| Bottom bar hide or show       | 180ms                  | `--ease-paper`                   | translateY                                                                                           | stays visible                   |
| Slips (the toast replacement) | 180ms in, 120ms out    | ease-out                         | opacity + 8px                                                                                        | opacity only                    |
| Letter decline or close       | 180ms                  | ease-out                         | the note slip's opacity to 0.6 and "Closed kindly" fades in                                          | instant                         |

- Nothing else animates.
- Removed: `motion/react` springs on buttons, staggered reveals, drag tilt, ghost overlays, the confetti
  burst, the Web Audio sounds, the "ambient glow", `animate-pulse` skeletons and 3-step spinners.
- `playSound` and `avatarGradient` in `modules/shared/lib/utils.ts` are deleted. `haptic` stays, used
  only for the seal press.
- `prefers-reduced-motion: reduce` applies the right-hand column globally (a `motion-safe:` utility or a
  `useReducedMotion` guard).

---

## 11. Iconography

- **Words before icons.** The masthead, bottom bar and MarginBar are text only. When an icon appears it
  sits beside a word.
- **lucide-react** for utility only: 20px, stroke 1.5 (already global), ink colour. Allowed: `ChevronLeft`
  and `ChevronRight` (page turn), `X` (close), `Share` (show my family), `Printer` and `Download` (export),
  `Flag` (report and safety notes), `Check` (fit ticks), `Pencil` (edit affordance on touch),
  `CalendarPlus` (booked calls).
- **Custom glyphs** (SVG in `packages/ui/components/rishta/`; `packages/ui/components/logo.tsx` becomes
  the wordmark):
    - `MonogramSeal`: pending (a 1px ink outline and dashed rim), pressed (a lac disc, marigold rim, paper
      initials), broken (two halves and a crack). Sizes 24, 40 and 64.
    - `PencilMark`: a pencil-drawn tick (Proceed), question mark (Let's talk) and strike (Not for us).
      Always shown with the words.
    - `VerifiedMark`: a small square stamp with a tick, always with words ("Verified email", "Verified
      phone").
    - Invocation glyphs: ॐ, ੴ and ﷽ set as text in their script fonts; a cross and a khanda as SVG.
- **Banned**: hearts, flames, sparkles, stars, bolts, crowns, gems, the interlocking rings, rose motifs
  and emoji anywhere in the UI or copy.
- **App icon** (`apps/saas/app/icon.tsx`): the pressed monogram seal "R" on paper. It is neutral on a
  lock screen: no rings, no heart, no rose.

---

## 12. Data visualisation

There are almost no charts, on purpose. People are not metrics.

- **Position**: stack edges plus "3 of 7". Never a dot per profile.
- **Completeness**: words per section ("Family: 2 of 5"). Never a percentage bar.
- **Values budget**: 12 ink squares split across three rows (■ given, □ free), on your own Looking-for
  page only. Never shown to others.
- **Time zones**: two aligned time labels per slot, in tabular numbers ("8:00 pm Edison · 7:00 pm
  Dallas"), with evening hours (6-10 pm local) marked by a hairline bracket.
- **Banned**: compatibility %, match meters, profile-view graphs, popularity counts, bid tiers and stat
  tiles (`StatsTile` and `StatsTileChart` are not used in the product).

---

## 13. Voice and microcopy

The voice is a respected, discreet family friend: warm, specific and unhurried. It is gently witty at
most ("Rishta aaya hai"). It never flirts, never pressures and never counts people.

| Moment                                 | Copy                                                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Sealed section                         | "Opens when you both say yes."                                                                                   |
| Unknown field in a fit reason          | "Community: not stated on his page."                                                                             |
| A gap                                  | "Diet differs: you're vegetarian, he isn't."                                                                     |
| A fit                                  | "You both hope to marry within a year." · "He's open to relocating; you're in Toronto."                          |
| End of folio                           | "That's today's folio. The next arrives tomorrow evening."                                                       |
| Composer counter                       | "14 more characters and you can seal it." · "Ready to seal."                                                     |
| Seal hint                              | "Press and hold to seal and send."                                                                               |
| Suggestion lock                        | "Make the line your own before sealing."                                                                         |
| Sent                                   | "Sealed and sent. He'll read it with your page."                                                                 |
| Say yes confirm                        | "Say yes to Arjun? Both seals break, and your sealed section opens to him."                                      |
| Introduction heading                   | "An introduction" · "Three evenings that suit you both"                                                          |
| Booked                                 | "Booked: Thursday 2 October, 8:00 pm Edison · 7:00 pm Dallas. We've emailed you both a calendar invite."         |
| Default decline note                   | "Thank you for writing. I don't think we're the right match, and I wish you well in your search."                |
| What the sender sees                   | "Priya has answered: not this time. She wished you well." · "This letter has closed." (quiet)                    |
| Close kindly (other side)              | "Arjun has decided not to continue. He wished you well."                                                         |
| A quiet week                           | "It's been a week. Propose a call, or close kindly."                                                             |
| Daily limit                            | "You've sealed three notes today. Tomorrow evening you can write again, or use a credit now."                    |
| Priority note (to the sender)          | "She'll see it labelled 'Priority note' at the top of her letters for two days."                                 |
| Family link watermark                  | "Shared privately with Ammi by Priya · open until Fri 3 Oct · not for forwarding"                                |
| Family link thanks                     | "Thank you. Priya will see 'Let's talk' beside the page."                                                        |
| Claim                                  | "Your mother, Nasreen, has written a page for you. Nothing about you is visible to anyone until you confirm it." |
| Safety note                            | "Take care: this note asks you to move to WhatsApp before you've spoken."                                        |
| Report                                 | "Tell us what happened. We read every report, and we won't tell them you reported."                              |
| Engaged                                | "Congratulations. We'll close your page kindly and let your open conversations know."                            |
| Email subjects (discreet, the default) | "A letter is waiting for you" · "Your letter has an answer" · "A time has been proposed" · "Your call is booked" |

- **Never write**: match %, compatibility, hot, crush, like or likes, swipe, super, boost, top pick,
  "N people are interested", top bid, rank, "don't miss out", hurry, streak, "you're running out", "Vow
  Aaya Hai" or any exclamation mark in system copy.
- **Pronouns**: "he" and "she" come from the page. Never assume gender elsewhere; say "they" when
  unknown.
- **Fair language**: the drafting assistant never writes complexion words ("fair", "wheatish"). There
  is no complexion field.
- **All strings** go through `packages/i18n/translations/en/saas.json` (the `folio`, `letters`,
  `biodata`, `household` and `family` namespaces). The `family` namespace is also written in hi, ur,
  pa, gu, bn, ta and te.

---

## 14. Accessibility

**Contrast of the key pairs** (WCAG 2.2, computed from the tokens above)

| Pair                                                              | Paper   | Lamp    | Requirement                                       |
| ----------------------------------------------------------------- | ------- | ------- | ------------------------------------------------- |
| Ink on page (`--foreground` / `--card`)                           | 16.59:1 | 13.04:1 | AAA                                               |
| Ink on desk (`--foreground` / `--background`)                     | 14.95:1 | 14.53:1 | AAA                                               |
| Muted ink on page (labels, meta)                                  | 7.08:1  | 5.04:1  | AA                                                |
| Muted ink on desk                                                 | 6.38:1  | 5.62:1  | AA                                                |
| Muted ink on `--muted`                                            | 5.79:1  | 4.55:1  | AA                                                |
| Pencil on page                                                    | 7.08:1  | 5.93:1  | AA                                                |
| Seal fill with its label (`--primary-foreground` / `--primary`)   | 7.81:1  | 5.54:1  | AA                                                |
| Accent text on page (`--seal-ink` / `--card`)                     | 7.57:1  | 5.15:1  | AA                                                |
| Accent text on the sealed section                                 | 6.31:1  | 4.84:1  | AA                                                |
| Ink button (`--secondary-foreground` / `--secondary`)             | 16.59:1 | 14.53:1 | AAA                                               |
| Success text on page                                              | 6.51:1  | 5.64:1  | AA                                                |
| Warning text on page                                              | 5.70:1  | 8.94:1  | AA                                                |
| Destructive text on page                                          | 11.18:1 | 7.03:1  | AA                                                |
| Destructive button (`--destructive-foreground` / `--destructive`) | 11.54:1 | 7.83:1  | AA                                                |
| Input boundary (`--input` / `--card`)                             | 3.99:1  | 3.13:1  | ≥ 3:1 (non-text)                                  |
| Focus ring on desk (`--ring` / `--background`)                    | 14.95:1 | 14.53:1 | ≥ 3:1                                             |
| Marigold rule on desk (`--rule`)                                  | 2.57:1  | 4.70:1  | decorative only, never text or the only indicator |
| Hairline border (`--border` / `--card`)                           | 1.75:1  | 1.27:1  | decorative only; field boundaries use `--input`   |

**Status colours under colour-vision deficiency** (Machado 2009 simulation, CIEDE2000 between
every pair of success, warning, destructive and `--seal-ink`): the smallest distance is 6.1 in Paper
(warning and the seal, deuteranopia) and 7.7 in Lamp (success and destructive, deuteranopia and
protanopia). Hue alone could not keep them apart at text contrast, so lightness does: in Paper,
destructive is the darkest and warning the lightest. Status colour is never the only signal: every
use carries a word, a glyph (the reasons' ✓ · ~ · ?, the pencil marks, the flag) or a sign (+2, −1).

**Focus**: a 2px solid `--ring` outline with a 2px offset in the background colour, square (circular on
the seal). It is always visible on keyboard focus (`:focus-visible`) and never removed.

**Targets**:

- 44×44px minimum everywhere.
- 56px for the MarginBar, the BottomBar cells and the family-link buttons.
- 64px for the seal.
- At least 8px between adjacent targets in the MarginBar.

**Semantics**:

- A page is an `<article>` with the name as `h1`, sections as `h2`, and fields as `<dl>` / `<dt>` / `<dd>`.
- The sealed section has `aria-label="Sealed. Opens when you both say yes."`
- A veiled photo has `alt="Photo, veiled until you both say yes"`.
- The Folio is a region with `aria-roledescription="page stack"`. Turning a page announces "Page 3 of 7,
  Arjun Mehta".
- Sheets are Radix or vaul dialogs with focus trap and return.
- Reasons use a glyph plus words, never colour alone.

**Gestures**:

- Every swipe has a button or key equivalent (WCAG 2.5.1).
- The hold-to-seal has tap-then-confirm (2.5.1, 2.5.7).
- No action relies on hover.

**Text**:

- Readable and unbroken at 200% zoom and at 130% Android font scale.
- Rem units; no fixed heights on text containers.
- Translated content carries `lang` and `dir`.

**Time**: nothing times out except the family link (the candidate can re-send). The 6-second Pass undo
is also reachable afterwards ("Passed pages" in the folio end slip).

**Motion**: `prefers-reduced-motion` is honoured as in §10.

---

## 15. Marketing site: art direction and outline

**Direction**: a letter, or an essay. The founders' letter is the homepage, with one biodata page read
top to bottom inside it. A language toggle re-sets that page in another script. Pricing sits in the
letter's last paragraph.

- **Art direction**:
    - The same paper, ink, seal and fonts as the product (Tiro and Anek replace Figtree in
      `apps/marketing/app/[locale]/layout.tsx`).
    - A 680px letter column on the desk.
    - The sample page at 620px, breaking out into a pencil margin on desktop.
    - No hero image, no stock couples, no phone mock-up carousel, no gradient, no feature-card grid, no
      testimonial carousel, no app-store badges.
    - Light only.
- **Outline of `/` (`apps/marketing/app/[locale]/(home)/page.tsx`)**:
    1. Masthead: the "Rishta" wordmark; on the right "Sign in" and [Begin a page] (a square seal-red
       button).
    2. Dateline in caps: "A LETTER FROM THE FOUNDERS · SEPTEMBER 2026".
    3. Salutation: "Dear family," (Tiro italic 28).
    4. Why: the forwarded biodatas, the WhatsApp groups, the dating apps that treat marriage like a game.
    5. What we made:
        - a small folio each evening
        - a note you write and seal
        - both seals breaking when you both say yes
    6. **The sample page**, read top to bottom, with pencil marginalia:
        - "This part stays sealed until you both say yes."
        - "No percentages, just the reasons."
        - "Written by his mother, confirmed by him."
        - The language row (English · हिन्दी · اردو · ਪੰਜਾਬੀ · ગુજરાતી · বাংলা · தமிழ் · తెలుగు) re-sets the
          page, from static, human-written sample content (no AI at runtime).
    7. For parents: the family link, with the three square buttons shown on a plain phone outline.
    8. Safety:
        - veiled photos, private reading, reports read by people, verification
        - the disclosure several US states require: "Rishta does not conduct criminal background checks
          on its members."
    9. **Pricing, as the last paragraph**: "Reading your folio and sealing three notes a day is free.
       Premium is $29 a month, or $290 a year, for families who want seven pages each evening, ten
       notes a day and room for the whole household. Credits are $5 for five. When you're engaged we
       close your page kindly; that is the point."
    10. Signature: "With respect," the founder's name, and a pressed seal. P.S. "Rishta aaya hai."
        [Begin a page].
    11. Footer: Safety · Privacy · Terms · Contact.
- **Other pages**:
    - `/[locale]/safety` (new): safety tips, reporting, the background-check disclosure, the IMBRA-neutral
      statement ("the same service and prices for everyone").
    - `/[locale]/legal/*` (rewritten for special-category data).
    - `/[locale]/contact`.
    - The blog stays but is renamed "Notes", with no nav prominence. The changelog is hidden.
- **Removed**: `HeroSection`, `FeaturesSection`, `PricingSection` (the table), the `FaqSection`
  accordion and `NewsletterSection`. Also the dark default in `apps/marketing/config.ts`.

---

## 16. Reconciliation: what the existing UI keeps

| Existing (commit `63deca1`)                                                                                                               | Decision                                     | Becomes                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| The biodata field set (parents' occupations, siblings, joint or nuclear, mother tongue, Jain vegetarian, eggetarian, annulled, createdBy) | **Keep**                                     | The page's sections and field rows, in traditional order                                |
| One profile at a time on Discover                                                                                                         | **Keep**                                     | The Folio reader (a small daily stack instead of an endless loop)                       |
| ← → arrow keys on Discover                                                                                                                | **Keep**                                     | Page turns                                                                              |
| The 5-step quiz, timeline first, with animated steps                                                                                      | **Keep the content and order**               | The first page (`/begin`), square option rows, a 180ms page turn                        |
| The 12-point values budget with a hard cap                                                                                                | **Keep**                                     | 12 ink squares; the same rule                                                           |
| Quiz → biodata → discover gating                                                                                                          | **Keep**                                     | The household-aware gate in §3.5                                                        |
| Contact sealed until mutual yes                                                                                                           | **Keep and strengthen**                      | The Sealed section (full name, workplace, contact, exact DOB, extra photos)             |
| Blocks in both directions                                                                                                                 | **Keep and extend**                          | Also hides pages, letters, readers and family links                                     |
| Server-gated messaging, 3s polling, read state                                                                                            | **Keep, restyle**                            | Correspondence inside the Introduction; a single quiet "Read" line; no bubbles or ticks |
| "Created by family" badge                                                                                                                 | **Evolve**                                   | The signer line plus a real household with claim                                        |
| Shortlist                                                                                                                                 | **Evolve**                                   | Kept pages, with pencil notes                                                           |
| Who viewed me                                                                                                                             | **Evolve**                                   | Readers, with incognito reading free                                                    |
| Photo upload to Supabase                                                                                                                  | **Evolve**                                   | Up to 5 photos, private bucket, signed URLs, veils, EXIF stripped                       |
| Daily limit of 3, 10 free credits, $29/month, 7-day trial                                                                                 | **Keep**                                     | Notes per day; credits for an extra note or a priority note; Premium                    |
| Warm stone neutrals                                                                                                                       | **Evolve**                                   | Paper and ink                                                                           |
| `calcAge` util                                                                                                                            | **Keep, dedupe**                             | One helper (it is copied into 4 pages today)                                            |
| Card-shaped skeletons                                                                                                                     | **Replace**                                  | `PaperSkeleton`                                                                         |
| Swipe with tilt, red X and pink heart overlays                                                                                            | **Remove**                                   | Swipe turns pages only                                                                  |
| Confetti, Web Audio sounds, spring buttons, ambient glow                                                                                  | **Remove**                                   | —                                                                                       |
| Per-person gradient banners, circular avatars                                                                                             | **Remove**                                   | The page header, the square photo box                                                   |
| Compatibility % badge (client formula)                                                                                                    | **Remove**                                   | Why this page (server, deterministic)                                                   |
| Credit bids, the bid slider, flames, "N people interested · Top bid", received sorted by bid                                              | **Remove** (`profileStats` also leaked data) | Priority note: a flat 1 credit, disclosed, pinned 48h, no numbers                       |
| Progress dots per profile                                                                                                                 | **Remove**                                   | Stack edge + "3 of 7"                                                                   |
| 11-item icon sidebar (`NavBar`, `AppWrapper`)                                                                                             | **Remove**                                   | Masthead + bottom bar                                                                   |
| Activity page of 4 stat cards                                                                                                             | **Remove**                                   | Completeness notes in the My Biodata margin                                             |
| /premium invented stats ("5x more views")                                                                                                 | **Remove**                                   | Honest Credits & plan                                                                   |
| Rose tokens, dark default, DM Sans + Outfit, rings logo, "Vow"                                                                            | **Remove**                                   | The tokens, type and wordmark above                                                     |

---

## 17. Anti-patterns (do not build, do not bring back)

**Template-isms to remove**

- The collapsible icon sidebar (`NavBar.tsx`) and `AppWrapper` as a sidebar shell, plus the hamburger
  menu.
- `PageHeader` title and subtitle stacks on every page, card grids (`Card` lists for people), `StatsTile`
  dashboards and the placeholder `OrganizationStart` home.
- `rounded-full` and `rounded-lg` everything, circular icon buttons, pill badges, the switch pill,
  shadows and blur.
- Figtree, DM Sans, Outfit, Inter. Indigo or rose accents. The dark default.
- The template's de/es/fr locale switcher in the saas app, instead of the languages families read.
- Full-screen spinners as a loading state, and `confirm()` dialogs (block today uses one).
- The generic AI chatbot tab (already deleted; keep it deleted).

**Dating-app skin (never)**

- Swipe-to-decide, drag tilt, like or pass overlays, super-likes, "It's a match!" screens.
- Confetti, sounds, haptics beyond the seal, springy buttons, staggered reveals.
- Hearts, flames, rings, sparkles, emoji, pink, rose, gradients, per-person colours.
- Chat bubbles with double ticks, typing indicators and online-now dots.

**Marketplace mechanics (never)**

- Bids, top bid, rank, "N people interested", boosts that buy visibility, popularity or view counts as
  headlines, "most viewed", "trending".
- Compatibility percentages, scores, stars, meters.
- Undisclosed paid placement of any kind.

**Wedding kitsch (never)**

- Gold foil, mandalas, paisley, henna patterns, Playfair or Cormorant, Bollywood imagery. Culture shows
  up as structure.

**Unsafe or disrespectful (never)**

- Clear photos served to non-matches (even blurred with CSS), public photo URLs, EXIF locations.
- A complexion field, filter or AI inference of complexion, caste, religiosity or family status.
- Family members sending or accepting for the candidate, or reading their messages.
- A parent-made page visible before the adult candidate claims it. Anyone under 18.
- Notification text that says who, or that uses a heart ("Someone liked you ❤").
- AI that decides, sends, rates looks, retouches photos or poses as a matchmaker ("Aunty AI").
- A kanban of people (To contact → Talking → Rejected).
