# SPEC.md: Rishta MVP

> This is the product and engineering spec for the MVP. **design.md** is the design contract (screens,
> shell, tokens, signature interaction), and every route here matches its information architecture.
> **vision.md** holds positioning and pricing rationale. Status tags in this document:
> **[Built]** exists and works today (commit `63deca1`); **[Evolve]** exists and changes;
> **[New]** is to be built; **[Remove]** is deliberately taken out, with the reason given.
> Last updated: 2026-09-26.

---

## 1. What it is

Rishta is a matchmaking app for people who want marriage, not dating, and for the families who
help them. It is built around the **biodata**: the one-page marriage profile that South Asian
diaspora families already write, print and forward on WhatsApp.

- A candidate, or a parent, sibling or relative helping them, writes a page and states their
  non-negotiables: marriage timeline, relocation, faith, diet, and what matters most.
- Each evening the candidate reads a small **folio** of complete, compatible pages, one at a time.
- To show interest they write a short **note** and press their **seal** onto it.
- When the other person says yes, **both seals break at once**. The sealed parts of both pages open
  (clear photos, full name, workplace, contact) and an **Introduction** proposes a first call at a
  time that works in both time zones.
- Family takes part in the margin, usually through a private WhatsApp link that needs no account.
  Only the adult candidate can seal, say yes or close.

Name: **Rishta** (the tagline is warm, not a slogan: "Rishta aaya hai"). The saas app, logo and the
previous spec used "Vow" / "Vow Aaya Hai" for a "universal, any culture" repositioning. That brand is
retired, and the reasons are in vision.md. The product leads with the South Asian diaspora (Hindu,
Sikh, Jain, Muslim and Christian families in the US, UK and Canada). It stays open to anyone, and
other family-involved communities are the expansion path. That is why the seed data stays
deliberately multicultural.

Deployment facts (unchanged): Vercel project `rishta-saas`, Supabase Postgres (session pooler, port
5432, because the transaction pooler breaks Drizzle prepared statements) and Supabase Storage.

---

## 2. Current state (audit of the existing build)

Rishta adds about 2,600 lines of saas pages and 800 lines of API on the supastarter template.

**Built and kept (and evolved):**

- 8 domain tables: `biodata_profile`, `partner_preference`, `interest`, `shortlist`, `profile_view`,
  `block_user`, `message`, `wallet`.
- 6 domain routers with 20 procedures (profiles, interests, preferences, shortlists, messages,
  wallet).
- The 5-step, timeline-first quiz with the 12-point values budget.
- The biodata form (6 sections, photo upload to Supabase).
- One-profile-at-a-time Discover.
- Interests (sent and received), matches, shortlist, "who viewed me", blocks in both directions.
- Server-gated messaging with 3-second polling and a read state.
- A daily limit of 3 interests for users without an active purchase, and a 10-credit wallet.

**Known bugs, fixed by this spec:**

1. **Core loop.** `listMatches` and `sendMessage` require two accepted interests, one in each
   direction. If A writes and B accepts, no match exists and neither can message. An accepted
   letter must create the match at once (§5 F8).
2. Quiz answers are mostly unused. Nothing reads `marriageTimeline`, `willingToRelocate`,
   `requiresCitizenship`, the values budget, `communities` or `educationLevels`. Preferences are
   stored as comma-separated free text, although the old spec promised arrays. The quiz suggests
   "halal, vegetarian" for diet, which never matches the profile enum.
3. Discover computes a compatibility % on the client with a different formula from the server sort.
4. The daily limit is counted from server-local midnight, not the user's day.
5. Credit deduction and the interest insert are not in one transaction.
6. `calcAge` is copied into 4 pages.

**Privacy leaks, fixed by this spec:**

- `profileStats` lets any user see any profile's pending-interest count, top bid and their own rank.
- `browse` returns every field of every matching profile, including employer and income, with no
  pagination.
- `getProfile` ignores blocks and `isActive`.
- Photos sit in a public `avatars` bucket served by `getPublicUrl`.
- `whoViewedMe` can show blocked users.
- Email verification is off ("TODO re-enable with Resend").

**Removed deliberately** (design.md §16):

- the swipe-to-decide skin: drag tilt, overlays, confetti, sounds and haptics outside the seal
- credit bids and the competition strip
- the compatibility % badge
- the 11-item sidebar
- the Activity stat cards
- the invented Premium statistics
- the rose, dark-default theme and the rings logo

Organizations were turned off. They come back as the **Household**.

---

## 3. Personas

1. **The candidate.** Single, 26-36, a second-generation professional in the US, UK or Canada:
   Priya, 29, a pharmacist in New Jersey, or Omar, 31, a software engineer. Also divorced or widowed
   people in their 30s and 40s trying again.
    - Reads on an iPhone between 9:30 and 11:30 p.m., one-handed, and glances discreetly at lunch.
      Writes the page on a laptop at the weekend.
    - Tired of dating apps and ghosting, under family pressure, and often on 2-3 apps at once.
    - Women receive far more interests than they send, so their daily job is triage and staying
      safe. Men's daily job is outreach.
    - Very app-literate, allergic to gamification.
2. **The parent.** Usually the mother, 52-68. She creates or co-manages the page, screens proposals
   and phones the other family.
    - Uses Android or iPhone at 120-130% system font, and lives in WhatsApp. Her first language is
      often Hindi, Urdu, Punjabi, Gujarati, Tamil, Bengali or Telugu.
    - Reads the family section before the photo.
    - Will open a link. Will not install and learn an app. Often the payer.
3. **The helper.** A sibling, cousin, aunt or community matchmaker ("rishta aunty"). Occasional to
   weekly; a sibling quietly checks out the other side. Values discretion and credit for the
   introduction. A paid matchmaker seat is future work.

## 4. Jobs to be done

1. When my parents keep forwarding biodatas on WhatsApp, give me one private place where serious,
   marriage-minded people arrive already matched to my non-negotiables, so I stop wasting evenings.
2. When I write my profile, help me present myself and my family as a biodata I'd be proud for my
   parents to forward, without writing it from scratch and without exposing more than I choose.
3. When someone writes to me, let me judge sincerity and fit in under a minute, with my family if I
   want, and answer kindly either way.
4. As a parent, let me help find and check matches for my child without taking over and without
   learning a new app. A WhatsApp link should be enough.
5. When we both say yes, give us a safe, structured way to a first call and a family meeting across
   time zones, without handing my phone number to a stranger.
6. Keep me safe and discreet. Let me control who sees my photo and whether my reading is recorded,
   and make it easy to block or report scammers, visa-seekers and harassers.
7. When I get engaged, let me close my page gracefully, let open conversations know kindly, and
   delete my data.

---

## 5. Features and acceptance criteria

### F1. Household and onboarding: "Who is this page for?" [New, on the template onboarding]

- [ ] Organizations are enabled in `packages/auth/config.ts` as follows:
    - `enable: true`, `requireOrganization: true`, `hideOrganization: true` (the UI says "household",
      never "organization"), and `enableUsersToCreateOrganizations: true`.
    - `forbiddenOrganizationSlugs` holds every top-level route word (design.md §3.3).
- [ ] `/onboarding` keeps the account step (name) and adds "Who is this page for?" with the choices
      Me, My son, My daughter, My brother, My sister, and Someone else in my family.
- [ ] Choosing an answer creates the household (`households.create`):
    - The slug is neutral: the first name plus 3 random characters (`priya-k3m`), never a full name.
    - The time zone comes from the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`.
    - It creates a `household_setting` row and a draft `biodata_profile` with a unique `handle`.
- [ ] If the page is for someone else, the creator becomes the owner temporarily. The page status is
      `awaiting_claim` once a candidate email is given, and `draft` until then. The copy says "They'll
      confirm the page before anyone can see it."
- [ ] `/` redirects to `/[activeSlug]`. A user in several households gets the "Searching for"
      switcher in the avatar menu.

### F2. Claiming a page a relative drafted [New]

- [ ] The drafter invites the candidate by email: a Better Auth invitation, marked in
      `household_setting.pendingCandidateEmail`.
- [ ] The candidate signs in with their own account and a **verified email**. `/[slug]/claim` shows
      the draft read-only, with "Nothing about you is visible to anyone until you confirm it."
- [ ] **Confirm** sets `biodata_profile.userId` to the candidate, `claimedAt` to now and the status
      to `draft`, ready to publish. Membership becomes owner = candidate and admin = drafter.
- [ ] **Decline** ("This isn't something I want") deletes the draft page and household data. The
      drafter receives a kind email and no reason is required.
- [ ] A page whose date of birth is under 18 years ago cannot be claimed or published (a factual,
      kind message).
- [ ] While awaiting claim, the household can edit the draft page and the looking-for draft, but the
      Folio is locked ("The folio opens when Priya confirms her page"). The page appears in no one's
      folio.

### F3. The first page: timeline-first non-negotiables [Evolve: `/quiz`]

- [ ] `/[slug]/begin` keeps the five steps and their order:
    1. timeline (plus "I'd like to meet a man / a woman", stored as `seeking`)
    2. where: relocation, residency, preferred places
    3. age, community, education
    4. faith and diet, each Dealbreaker or Nice to have
    5. what matters most: the 12-point budget
- [ ] Answers are typed:
    - single-choice rows for timeline, relocation and residency
    - multi-select chips for faiths, diets, communities (free entry allowed), education levels and
      places
    - numeric steppers for age and height
- [ ] Diet choices are the page's own enum values (fixes the halal/vegetarian mismatch).
- [ ] The values budget keeps its hard cap: points across looks, personality and financial stability
      never exceed 12, each is 1-10, and "0 points left" confirms the choice.
- [ ] Finishing sets `partner_preference.completedAt` (and `quizComplete = true` for compatibility)
      and goes to `/[slug]/biodata`.
- [ ] Afterwards, `/[slug]/biodata/looking-for` edits the same data in place. Changes affect tomorrow's
      folio, not today's.

### F4. My Biodata: the in-place editor [Evolve: `/profile`, `/profile/edit`, `/activity`]

- [ ] One page reads and edits: `/[slug]/biodata`. Every field edits in place and saves with
      `profiles.patch`. The existing full-form `profiles.upsert` stays for the guided first write and for
      compatibility.
- [ ] Section order follows the real document:
    1. optional invocation
    2. name block
    3. personal
    4. education and work
    5. family
    6. lifestyle
    7. about
    8. looking for
    9. sealed
- [ ] New fields: `fullName`, `nativePlace`, `languages`, `sect`, `practice`, `familyValues`,
      `aboutFamily`, `hasChildren`, `residency`, `country`, `timeZone`, horoscope (`birthTime`,
      `birthPlace`, `manglik`), invocation, `pageLanguage` and `contactPhone`. All are optional except
      the existing required four (display name, gender, date of birth, faith).
- [ ] **Visibility per field** (Shown · Sealed · Matching only) is stored in `fieldVisibility`.
    - Defaults: `fullName`, `employer`, `incomeRange`, exact `dateOfBirth`, `birthTime`, `birthPlace`
      and `contactPhone` are Sealed. Community and faith offer Matching only, with explicit consent
      copy.
    - The page shows the birth month and year to strangers. The full date opens with the seal.
- [ ] **Photos** [Evolve]:
    - Up to 5 photos per page, each with visibility `everyone` | `after_note` | `after_yes`
      (default `after_yes`).
    - Uploads go to a **private** bucket `biodata-photos` via signed upload URLs from
      `@repo/storage`, and are re-encoded client-side to strip EXIF.
    - A 32px veil derivative is stored for each photo.
    - Clear images are only served as short-lived signed URLs to people the photo's visibility allows.
    - The legacy public `profilePhoto` is migrated.
- [ ] **Completeness** appears as words per section in the margin ("Family: 2 of 5"), replacing the
      Activity page's bar and stat cards.
- [ ] **Preview as**: stranger, after yes, family link.
- [ ] **Export**:
    - A watermarked A4 PDF (`@react-pdf/renderer`) via `GET /api/biodata/[handle]/pdf`.
    - A WhatsApp image (PNG via `next/og`) via `GET /api/biodata/[handle]/image`.
    - Both show only the stranger view unless the owner exports their own full page.
- [ ] **Publish** checks the required fields, 18+, a claimed page and a complete looking-for, then
      sets `status = active`. **Pause** and **Resume** toggle `paused`.
- [ ] **Help me write** (F17a) appears when AI is configured.

### F5. Folio: the daily pages [Evolve: Discover `/`, browse]

- [ ] `/[slug]` shows today's folio: 5 pages on Free, 7 on Premium.
    - It is released at `household_setting.folioReleaseHour` (default 19:00) in the candidate's time
      zone.
    - It is generated lazily on the first `folio.today` call after release. Before release, the
      previous folio stays current.
- [ ] Eligibility and ordering follow §7 exactly. The client never sees a score.
- [ ] Pages are read one at a time and turn with a swipe, the ← → keys or the margin chevrons. A turn
      never answers a page.
- [ ] **Keep**, **Pass** (optional private reason, with a 6-second Undo) and **Write a note** (F6) are
      the only answers.
    - Keep writes `shortlist` and sets `folio_page.state = kept`.
    - Pass sets `passed` and `passReason`.
    - Opening a page sets `read` and records a read (F16) unless the reader is incognito.
- [ ] "3 of 7" and the stack edge show position. There are no progress dots.
- [ ] The end slip reads "That's today's folio. The next arrives tomorrow evening." with kept and
      written counts and "Passed pages" (undo).
- [ ] An unanswered page may return in a later folio at most once, after 3 or more days, marked "You've
      seen this page before".
- [ ] Empty, first-release, error and closed-mid-read states match design.md §5.1.
- [ ] Guardian and family members can read the folio if `familyReadsFolio` is on. They see "Keep for
      Priya" and "Pencil a note" and never the composer.
- [ ] **Kept pages** at `/[slug]/folio/kept` use the same reader over `shortlist`, newest first, with
      every pencil note.

### F6. Seal with a note: sending interest [Evolve: `interests.send`]

- [ ] Only the household **owner** (the candidate) on an **active** page can seal.
- [ ] The note is 40-400 characters after trimming. The salutation and signer line are added
      automatically.
- [ ] The seal unlocks at 40 characters. It is pressed by holding 600ms, by holding Enter or Space
      on the focused seal, or by tapping and then confirming (design.md §6).
- [ ] If the note contains a stored suggestion line verbatim, the server rejects it:
      `SUGGESTION_UNEDITED`.
- [ ] If the note contains contact details (phone, email, a WhatsApp/Telegram/Signal handle, a URL),
      the server rejects it: `CONTACT_IN_NOTE`.
- [ ] Daily limit:
    - 3 notes per household local day on Free and 10 on Premium.
    - The day runs from midnight in the household time zone (fixes the server-midnight bug).
    - Over the limit, 1 credit buys one extra note.
- [ ] **Priority note**: 1 credit.
    - `isPriority = true` and `priorityUntil = now + 48h`.
    - It is shown to the recipient as "Priority note" and pinned at the top of her waiting letters.
    - At most one active priority note per sender-recipient pair.
    - No amounts, ranks or competition are ever shown.
- [ ] The credit spend, ledger row and letter insert happen in **one transaction**.
- [ ] The notes are refused if:
    - either side has blocked the other, the recipient's page is not active, or a letter already exists
      in either direction
    - the recipient already wrote to you and is waiting (`ALREADY_WROTE_TO_YOU`, and the UI opens their
      letter)
- [ ] The recipient gets an in-app notification and a discreet email ("A letter is waiting for
      you"). F15 covers notifications.
- [ ] The safety screen (F17d) runs on the note. A flag is stored for the recipient's view and never
      blocks sending, except the hard contact rule above.
- [ ] The sender can **take back** a pending note (`withdraw`). The recipient then sees "Arjun took
      back his note."
- [ ] Removed: `bidAmount` bidding (the 0-100 credit slider), sorting received letters by bid, and
      `interests.profileStats`.

### F7. Letters [Evolve: `/interests`, `/matches`, `/messages`]

- [ ] `/[slug]/letters` has four groups:
    - **Waiting for your answer**: received and pending, oldest first; priority notes pinned for 48h and
      labelled.
    - **Introductions**: matches, by next scheduled time, then latest message.
    - **Your sealed notes**: sent and pending, newest first.
    - **Closed**: declined, withdrawn, closed or expired; collapsed.
- [ ] Rows show name, age, city, state in words and the first line of the note. **No photos.** They
      carry disclosed labels (Priority note, ⚑ Take care) and a pencil mark if family reacted.
- [ ] The masthead count is waiting letters plus introductions waiting on the candidate's move.
- [ ] `/[slug]/letters/[letterId]` opens a letter. The letter id is the `interest.id` and stays the
      same URL through the whole thread. `/letters/[letterId]` (chrome-free) resolves the same letter for
      email links.
- [ ] Pending letters with no answer close automatically after 30 days, lazily on read ("No answer
      came. The letter has closed."), so nobody is left guessing.
- [ ] Guardian and family see "Priya's letters are private to her". If `familySeesIntroductions` is
      on, they see introduction stage lines only, never notes or messages.

### F8. Answering: say yes, decline kindly, close quietly [Evolve: `interests.respond`]

- [ ] Only the recipient household's owner can answer.
- [ ] **Say yes** has a confirm step. In one transaction it sets `status = accepted`, creates the
      `match` (fixing the core-loop bug) and creates the system `call_proposal` with three evenings
      (§5 F9).
    - Both sides can then message.
    - The sender gets "Your letter has an answer".
- [ ] **Decline kindly**: `declineMode = kind_note` with an editable default note. The sender sees
      "Priya has answered: not this time. She wished you well." plus the note.
- [ ] **Let it close quietly**: `declineMode = quiet`. The sender sees "This letter has closed."
- [ ] Declines are final. A second letter to the same person is not allowed (the unique pair
      remains).
- [ ] If the sender withdrew first, the answer fails gracefully and no match is created.
- [ ] Declines never send email by default; they appear in-app. Nobody sees a red X.

### F9. Introduction: seals broken, first call, correspondence, close kindly [Evolve: matches and chat]

- [ ] On accept, both sealed sections open to each other: clear photos (by visibility), full name,
      workplace, exact date of birth, horoscope details if given, and the email plus phone if shared.
- [ ] **Both seals break together**. On the acceptor's screen the break plays at once. On the sender's
      screen it plays live (via polling) or once on first open, tracked by `sealsSeenByAAt` and
      `sealsSeenByBAt`.
- [ ] **Three proposed times**. The Introduction arrives with three evenings, computed as the next
      three dates where both local times fall between 18:00 and 22:00, on 30-minute steps.
    - Each person ticks the slots that work. The lowest-index slot both ticked is booked.
    - "Propose three others" lets either person propose three of their own. The proposer is assumed
      available, and the other picks one.
    - On booking, both get an email with an `.ics` invite showing both local times, and the stage
      becomes `call_booked`.
- [ ] **Families step**: each side can opt to share a family contact (`familyContactName` and
      `familyContactPhone`). Both see them only once both have shared. The stage becomes `families`.
- [ ] **Correspondence** [Evolve]:
    - Messages are gated on the server by an open `match`, not by two accepted interests.
    - Polling every 3 seconds while open plus refetch on focus (as today).
    - Up to 2,000 characters, and one quiet "Read" line under your last message.
- [ ] After 7 quiet days, one pencil line appears: "It's been a week. Propose a call, or close
      kindly." This is deterministic, not AI.
- [ ] **Close kindly**: choose or edit a closing note. The other side sees "Nikhil has decided not to
      continue. He wished you well." plus the note. The match becomes `closed`, messaging stops, and the
      thread stays readable to both.
- [ ] Removed: the bare email reveal on `/matches` and the iMessage-style bubbles and ticks.

### F10. Show my family: family links and pencil notes [New]

- [ ] From any page (folio, kept, a received letter), the owner or a guardian can create a family
      link:
    - a recipient label ("Ammi")
    - a language: en, hi, ur, pa, gu, bn, ta or te
    - an expiry of 1, 3 or 7 days
    - an optional "Include his note" for received letters
- [ ] The link is `/f/[token]`: a 32-byte random token, of which only a SHA-256 hash is stored. It is
      shared via the Web Share API, or a `wa.me/?text=` link on desktop, with neutral text.
- [ ] `/f/[token]` needs no account, is `noindex` and forced Paper theme, and is server-rendered with
      a minimal client island. It shows:
    - the stranger view of the page at 130% type in the chosen language, labelled "Translated · show
      original"
    - a watermark naming the recipient and the sharer
    - the three square reactions: **Proceed**, **Let's talk**, **Not for us**
    - optional words (280 characters) and "Report this page"
- [ ] A reaction is saved on tap and can be changed until expiry. It appears in the household's margin
      as a pencil note signed "Ammi (via link)".
- [ ] The candidate gets an in-app notification (email optional).
- [ ] A page owner can refuse to appear on family links (`familyLinksAllowed = false`). Their page then
      shows "This family prefers their page isn't shared by link" in place of the Show my family button.
- [ ] Expired or revoked links show "This link has closed. Ask Priya to send it again."
- [ ] Reactions never change a letter's state. Only the candidate can say yes.
- [ ] Household members with accounts add pencil notes in the app (`margin.add`) with the same three
      reactions or free words.

### F11. Household members and roles [Evolve: the template organizations]

- [ ] `/[slug]/settings/members` lists members with relation labels ("Ammi", "Bhaiya") and roles.
    - The owner is the candidate: "holds the seal".
    - Admins are guardians.
    - Members are family.
- [ ] Invitations use Better Auth (existing `InviteMemberForm`, reworded). The owner and guardians can
      invite at the member role. Only the owner changes roles or removes people.
- [ ] Household settings (`household_setting`) hold these switches:
    - `familyReadsFolio` (default on)
    - `familyEditsPage` (default off after claim)
    - `familySeesIntroductions` (default off)
    - `familyLinksAllowed` (default on)
    - `readIncognito` (default off)
    - `discreetEmails` (default on)
    - `folioReleaseHour` (default 19)
    - the family language (default `hi`, editable)
- [ ] Seat limits: Free allows the candidate plus 2 members; Premium the candidate plus 6.
- [ ] Guardian edits to the page (when allowed) are marked "Edited by Ammi · Undo" in the margin.

### F12. Safety and privacy [Evolve + New]

- [ ] **Blocks** [Evolve]:
    - Blocking works both ways and hides the other person's page, letters, messages, readers entries and
      family links, in addition to excluding them from folios (as today).
    - It moves from `confirm()` to a square dialog with a reason.
- [ ] **Reports** [New]:
    - Categories: `scam_money`, `harassment`, `fake_profile`, `underage`, `pressure_to_marry`, `hate`,
      `other`. They can be filed from a page, a letter, a message or a family link.
    - Details go up to 2,000 characters, with "Also block them" checked by default.
    - The reporter is never revealed.
    - The admin queue at `/admin/reports` supports open → reviewing → actioned or dismissed, with notes.
      "Actioned" can pause the reported page.
- [ ] **Incognito reading** [New, free]: when `readIncognito` is on, reads are not recorded.
- [ ] **Photo privacy** [Evolve]: see F4. Veils are server-made derivatives, not CSS-blurred clear
      images.
- [ ] **18+** [New]: the date of birth must be 18 or more years ago to claim or publish.
- [ ] **Email verification** [Evolve]: re-enabled with Resend. It is required for claim and publish.
    - Verification levels: `none`, `email`, `phone` (future), `id` (future).
    - `isVerified` becomes derived; nothing set it before.
- [ ] **Leaks closed**:
    - `profileStats` is removed.
    - `browse` is replaced by `folio.today`, which returns stranger-redacted pages, 7 at most.
    - `getProfile` becomes `profiles.getPage` with block, status, claim and relationship checks.
    - `whoViewedMe` excludes blocked users.
- [ ] **Sensitive-data consent**: faith, community and residency carry explicit consent copy
      ("Shown on my page / Used only for matching"). No complexion field and no filter on it. Caste and
      community are optional, self-described, never inferred and never a default filter.
- [ ] **Safety notice** in the footer and on marketing `/safety`: "Rishta does not conduct criminal
      background checks on its members". The same service and prices apply regardless of gender or
      nationality.

### F13. Close my search [New]

- [ ] `/[slug]/close` offers three reasons: We're engaged, Taking a break, Something else.
- [ ] **Taking a break**: the status becomes `paused`. The page leaves all folios and no new folio is
      generated. Letters and introductions stay open. Resume is one tap.
- [ ] **Engaged** or **something else**, in one transaction:
    - the status becomes `closed` and `closedReason` is recorded
    - pending received letters are declined with a kind note
    - pending sent notes are withdrawn
    - open introductions are closed with the candidate's closing note (editable default)
    - family links are revoked
- [ ] Afterwards the page offers an optional story (`closingStory`) and a referral ("Send someone a
      page to begin").
- [ ] **Delete everything**: a second confirm, then a hard delete of the account and household data
      (photos in storage, messages, reads, letters, links). This reuses the template's `DeleteAccountForm`
      plus cascades.

### F14. Credits and Premium [Evolve: `wallet`, `/premium`]

- [ ] The wallet is per **household** (`wallet.organizationId`). New households get 10 credits (an
      existing fact) with a `welcome` ledger row.
- [ ] A credit buys one extra note beyond the daily limit, or one priority note.
- [ ] Credits are bought as a pack: $5 for 5 credits (a one-time price, see §11). The Stripe
      `checkout.session.completed` webhook grants them idempotently (unique `purchaseId` in the ledger).
- [ ] Premium ($29/month or $290/year, 7-day trial, all existing facts) is attached to the household
      (`billingAttachedTo: "organization"`, as configured today). The daily-limit check reads the
      household's active purchase, not the user's.
- [ ] `/[slug]/settings/billing` shows the plan, credits, the ledger and plain comparisons. No "5x
      more views" and no "Most popular".

### F15. Notifications and email [New, on the template notifications]

See §10. Every notification is discreet: subjects never contain a name, a heart or a verdict.

### F16. Readers: who read my page [Evolve: `/viewers`]

- [ ] `/[slug]/biodata/readers` lists who read your page, newest first ("Harpreet Singh read your page
      · Tuesday"), without photos or a totals headline.
- [ ] Reads are recorded once per reader pair (as today, unique). They are not recorded when the
      reader is incognito, and blocked users never appear.
- [ ] The margin of My Biodata links to it quietly ("4 this week").

### F17. AI assists [Evolve: `packages/ai`, the unused `ai` module]

See §9. AI produces visible drafts only, never decisions. Every AI surface has a no-key fallback.

---

## 6. Data model

Drizzle schema: `packages/database/drizzle/schema/postgres.ts`. Keys are cuid text, as in the
template. The Prisma schema (`packages/database/prisma/schema.prisma`) mirrors the enums the template
uses (NotificationType) so that `prisma generate` and `@repo/notifications` keep working. New enums
are `pgEnum`s. Existing text columns keep their names and become typed at the zod layer first, and
become enums in the migration.

**Org scoping**: every domain row carries the `organizationId` of the household it belongs to, and
every procedure checks membership and role via `verifyOrganizationMembership`
(`packages/api/modules/organizations/lib/membership.ts`). Cross-household reads, such as another
household's page, go only through redaction functions (`toPageView`), never raw rows.

### 6.1 Enums

```ts
BiodataStatus = "draft" | "awaiting_claim" | "active" | "paused" | "closed";
Gender = "male" | "female";
MaritalStatus = "never_married" | "divorced" | "widowed" | "annulled";
Religion =
	"hindu" |
	"muslim" |
	"sikh" |
	"christian" |
	"jain" |
	"buddhist" |
	"jewish" |
	"parsi" |
	"other" |
	"none";
Practice = "very" | "moderately" | "somewhat" | "not_practising";
EducationLevel =
	"high_school" | "diploma" | "bachelors" | "masters" | "phd" | "professional" | "other";
IncomeRange =
	"under_50k" | "50k_75k" | "75k_100k" | "100k_150k" | "150k_plus" | "prefer_not_to_say";
FamilyType = "joint" | "nuclear";
FamilyValues = "traditional" | "moderate" | "liberal";
Diet = "veg" | "eggetarian" | "vegan" | "jain_veg" | "non_veg" | "halal";
Smoking = "never" | "occasionally" | "regularly";
Drinking = "never" | "occasionally" | "socially" | "regularly";
PageAuthor = "self" | "parent" | "sibling" | "relative" | "friend"; // was createdBy
CandidateRelation = "self" | "son" | "daughter" | "brother" | "sister" | "relative";
Residency = "citizen" | "permanent_resident" | "work_visa" | "student_visa" | "other";
Manglik = "yes" | "no" | "partial" | "dont_know";
Invocation =
	"none" | "om" | "shri_ganesh" | "bismillah" | "ik_onkar" | "cross" | "khanda" | "custom";
PageLanguage = "en" | "hi" | "ur" | "pa" | "gu" | "bn" | "ta" | "te";
FieldVisibility = "page" | "sealed" | "matching_only";
PhotoVisibility = "everyone" | "after_note" | "after_yes";
Verification = "none" | "email" | "phone" | "id";
Timeline = "3_months" | "6_months" | "1_year" | "2_years_plus";
Relocation = "open" | "within_country" | "not_open";
ResidencyRequirement = "citizen_or_pr" | "open";
FitKey =
	"timeline" |
	"religion" |
	"diet" |
	"age" |
	"marital_status" |
	"location" |
	"residency" |
	"education" |
	"community" |
	"language" |
	"height";
FolioPageState = "unread" | "read" | "kept" | "passed" | "noted";
PassReason = "timeline" | "distance" | "family" | "faith" | "lifestyle" | "feeling" | "other";
LetterStatus = "pending" | "accepted" | "declined" | "withdrawn" | "closed";
DeclineMode = "kind_note" | "quiet";
IntroductionStage = "introduced" | "call_booked" | "families" | "closed";
CloseReason =
	"not_a_fit" | "engaged_elsewhere" | "search_closed" | "engaged_to_each_other" | "other";
CallProposalStatus = "open" | "booked" | "superseded" | "declined";
FamilyReaction = "proceed" | "lets_talk" | "not_for_us";
ReportCategory =
	"scam_money" |
	"harassment" |
	"fake_profile" |
	"underage" |
	"pressure_to_marry" |
	"hate" |
	"other";
ReportContext = "page" | "letter" | "message" | "family_link";
ReportStatus = "open" | "reviewing" | "actioned" | "dismissed";
LedgerReason =
	"welcome" |
	"purchase" |
	"monthly_grant" |
	"extra_note" |
	"priority_note" |
	"refund" |
	"adjustment";
ClosedReason = "engaged" | "break" | "other";
SafetyCategory = "money" | "off_platform" | "visa" | "harassment";
```

### 6.2 Template tables used as-is

- `user`: `name`, `email`, `emailVerified`, `role` (admin for moderation), `locale`,
  `onboardingComplete`, `lastActiveOrganizationId`.
- `session`: `activeOrganizationId`, the active household.
- `organization`: the **household**. `name` is shown only to its members (for example "Priya's
  page"); `slug` is neutral.
- `member`: `role`. The owner is the candidate, the admin a guardian, a member is family.
- `invitation`: family invites and the candidate claim invite.
- `purchase`: `organizationId` = the household. `type` is SUBSCRIPTION (Premium) or ONE_TIME (credit
  packs).
- `notification` and `user_notification_preference`: new NotificationType values (§10).

### 6.3 `biodata_profile` [Evolve]

| Field                                      | Type                                                            | Notes                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| id                                         | text PK                                                         | cuid                                                                                                                  |
| organizationId                             | text FK → organization, NOT NULL, UNIQUE, cascade               | **new**: one page per household                                                                                       |
| userId                                     | text FK → user, **NULL**, UNIQUE, cascade                       | the candidate; was NOT NULL. Set at creation when the page is "for me"; null until claimed when a relative drafts it. |
| handle                                     | text NOT NULL UNIQUE                                            | **new**: 6 Crockford-base32 characters, shown as "No. 7KQ-2M9", URL `/b/7kq2m9`                                       |
| status                                     | BiodataStatus NOT NULL default `draft`                          | **new**: replaces `isActive`                                                                                          |
| isActive                                   | boolean                                                         | legacy: kept in sync (`status = active`) until the migration drops it                                                 |
| displayName                                | text NOT NULL                                                   | shown ("Priya S.")                                                                                                    |
| fullName                                   | text                                                            | **new**, sealed by default                                                                                            |
| gender                                     | Gender NOT NULL                                                 | —                                                                                                                     |
| dateOfBirth                                | text NOT NULL (YYYY-MM-DD)                                      | 18+ enforced; strangers see month and year only                                                                       |
| height                                     | integer (cm)                                                    | —                                                                                                                     |
| religion                                   | Religion NOT NULL                                               | Shown or Matching only                                                                                                |
| sect                                       | text                                                            | **new**, optional, self-described                                                                                     |
| practice                                   | Practice                                                        | **new**                                                                                                               |
| community                                  | text                                                            | optional, self-described                                                                                              |
| motherTongue                               | text                                                            | —                                                                                                                     |
| languages                                  | text[] default `{}`                                             | **new**                                                                                                               |
| maritalStatus                              | MaritalStatus NOT NULL default `never_married`                  | —                                                                                                                     |
| hasChildren                                | boolean                                                         | **new**, optional                                                                                                     |
| education                                  | EducationLevel                                                  | adds `high_school` and `professional`                                                                                 |
| university                                 | text                                                            | —                                                                                                                     |
| profession                                 | text                                                            | —                                                                                                                     |
| employer                                   | text                                                            | sealed by default (was shown)                                                                                         |
| incomeRange                                | IncomeRange                                                     | sealed by default                                                                                                     |
| familyType                                 | FamilyType                                                      | —                                                                                                                     |
| familyValues                               | FamilyValues                                                    | **new**                                                                                                               |
| fatherOccupation, motherOccupation         | text                                                            | —                                                                                                                     |
| siblings                                   | text                                                            | free text (kept)                                                                                                      |
| nativePlace                                | text                                                            | **new**                                                                                                               |
| aboutFamily                                | text (≤ 1200)                                                   | **new**                                                                                                               |
| diet                                       | Diet NOT NULL default `non_veg`                                 | adds `halal`                                                                                                          |
| smoking                                    | Smoking NOT NULL default `never`                                | —                                                                                                                     |
| drinking                                   | Drinking NOT NULL default `never`                               | —                                                                                                                     |
| aboutMe                                    | text (≤ 1500)                                                   | —                                                                                                                     |
| lookingFor                                 | text (≤ 1200)                                                   | —                                                                                                                     |
| createdBy                                  | PageAuthor NOT NULL default `self`                              | adds `friend`; drives the signer line                                                                                 |
| location                                   | text                                                            | city, region (kept)                                                                                                   |
| country                                    | text (ISO 3166-1 alpha-2)                                       | **new**                                                                                                               |
| timeZone                                   | text (IANA) NOT NULL                                            | **new**: from the browser at onboarding                                                                               |
| residency                                  | Residency                                                       | **new**; Matching only by default                                                                                     |
| birthTime, birthPlace                      | text                                                            | **new**, sealed                                                                                                       |
| manglik                                    | Manglik                                                         | **new**                                                                                                               |
| invocation                                 | Invocation default `none`                                       | **new**                                                                                                               |
| invocationText                             | text (≤ 60)                                                     | **new** (for `custom`)                                                                                                |
| pageLanguage                               | PageLanguage NOT NULL default `en`                              | **new**: the script the page is written in                                                                            |
| fieldVisibility                            | jsonb `Partial<Record<VisibleField, FieldVisibility>>` NOT NULL | **new**                                                                                                               |
| verification                               | Verification NOT NULL default `none`                            | **new**; `isVerified` stays as a legacy mirror                                                                        |
| isVerified                                 | boolean                                                         | legacy                                                                                                                |
| contactPhone                               | text (E.164)                                                    | **new**, sealed                                                                                                       |
| familyContactName, familyContactPhone      | text                                                            | **new**, shared only at the families step                                                                             |
| profilePhoto                               | text                                                            | legacy public URL: migrated to `biodata_photo`, then dropped                                                          |
| claimedAt, publishedAt, pausedAt, closedAt | timestamp                                                       | **new**                                                                                                               |
| closedReason                               | ClosedReason                                                    | **new**                                                                                                               |
| closingStory                               | text (≤ 2000)                                                   | **new**, optional                                                                                                     |
| createdAt, updatedAt                       | timestamp                                                       | —                                                                                                                     |

Indexes: `status`, `gender`, `religion`, `organizationId`, `handle`.

### 6.4 `biodata_photo` [New]

| Field          | Type                                         | Notes                                                              |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| id             | text PK                                      | —                                                                  |
| profileId      | text FK → biodata_profile, cascade           | —                                                                  |
| organizationId | text FK → organization, cascade              | scoping                                                            |
| storageKey     | text NOT NULL                                | private bucket `biodata-photos` (`external:` prefix for seed URLs) |
| veilKey        | text NOT NULL                                | the 32px derivative                                                |
| width, height  | integer                                      | —                                                                  |
| position       | smallint 0-4                                 | unique (profileId, position); 0 is primary                         |
| visibility     | PhotoVisibility NOT NULL default `after_yes` | —                                                                  |
| createdAt      | timestamp                                    | —                                                                  |

### 6.5 `partner_preference` [Evolve] ("Looking for")

| Field                                           | Type                          | Notes                                                                                    |
| ----------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| id                                              | text PK                       | —                                                                                        |
| organizationId                                  | text FK, NOT NULL, UNIQUE     | **new**                                                                                  |
| userId                                          | text FK, NULL                 | legacy candidate link                                                                    |
| seeking                                         | Gender NOT NULL               | **new**: default is the opposite of the page's gender, editable, never assumed elsewhere |
| marriageTimeline                                | Timeline                      | was text                                                                                 |
| relocation                                      | Relocation                    | **new**, from `willingToRelocate` (true → `open`, false → `not_open`)                    |
| residencyRequirement                            | ResidencyRequirement          | **new**, from `requiresCitizenship`                                                      |
| willingToRelocate, requiresCitizenship          | boolean                       | legacy mirrors                                                                           |
| valuesLooks, valuesPersonality, valuesFinancial | integer 1-10, sum ≤ 12        | kept exactly                                                                             |
| ageMin, ageMax                                  | integer 18-80                 | —                                                                                        |
| heightMin, heightMax                            | integer cm                    | —                                                                                        |
| religions                                       | Religion[]                    | was comma text                                                                           |
| communities                                     | text[]                        | was comma text                                                                           |
| educationLevels                                 | EducationLevel[]              | was comma text                                                                           |
| professions                                     | text[]                        | kept, not used in fit                                                                    |
| locations                                       | text[]                        | cities or regions                                                                        |
| countries                                       | text[] (ISO)                  | **new**                                                                                  |
| diet                                            | Diet[]                        | was comma text                                                                           |
| maritalStatus                                   | MaritalStatus[]               | was comma text                                                                           |
| languages                                       | text[]                        | **new**                                                                                  |
| dealbreakers                                    | FitKey[] default `{timeline}` | **new**: hard filters                                                                    |
| quizComplete                                    | boolean                       | legacy mirror of `completedAt`                                                           |
| completedAt                                     | timestamp                     | **new**                                                                                  |
| createdAt, updatedAt                            | timestamp                     | —                                                                                        |

### 6.6 `household_setting` [New]

| Field                   | Type                               | Default                           |
| ----------------------- | ---------------------------------- | --------------------------------- |
| organizationId          | text PK FK → organization, cascade | —                                 |
| candidateRelation       | CandidateRelation NOT NULL         | —                                 |
| pendingCandidateEmail   | text                               | null                              |
| familyReadsFolio        | boolean                            | true                              |
| familyEditsPage         | boolean                            | false (true while awaiting claim) |
| familySeesIntroductions | boolean                            | false                             |
| familyLinksAllowed      | boolean                            | true                              |
| familyLanguage          | PageLanguage                       | `hi`                              |
| readIncognito           | boolean                            | false                             |
| discreetEmails          | boolean                            | true                              |
| keyboardShortcuts       | boolean                            | true                              |
| folioReleaseHour        | smallint 0-23                      | 19                                |
| createdAt, updatedAt    | timestamp                          | —                                 |

### 6.7 `folio` and `folio_page` [New]

`folio`: `id`, `organizationId` FK, `releaseDate` date (household-local), `size` smallint (5 or 7),
`generatedAt`. Unique on (organizationId, releaseDate).

`folio_page`:

| Field                 | Type                               | Notes                                                                                   |
| --------------------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| id                    | text PK                            | —                                                                                       |
| folioId               | text FK → folio, cascade           | —                                                                                       |
| organizationId        | text FK                            | reader household                                                                        |
| profileId             | text FK → biodata_profile, cascade | the page shown                                                                          |
| position              | smallint                           | 1-based                                                                                 |
| reasons               | jsonb `FitReason[]`                | `{ key: FitKey, verdict: 'fits' \| 'gap' \| 'unknown', params: Record<string,string> }` |
| score                 | integer                            | internal ordering only; never selected into API output                                  |
| state                 | FolioPageState default `unread`    | —                                                                                       |
| passReason            | PassReason                         | private                                                                                 |
| seenBefore            | boolean default false              | —                                                                                       |
| answeredAt, createdAt | timestamp                          | —                                                                                       |

Unique on (folioId, profileId). Index on (organizationId, profileId).

### 6.8 `interest` [Evolve] (a "letter")

| Field                                | Type                                                                          | Notes                                                                |
| ------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| id                                   | text PK                                                                       | also the letter id in URLs                                           |
| fromUserId, toUserId                 | text FK → user, cascade                                                       | kept; unique (from, to) kept                                         |
| fromOrganizationId, toOrganizationId | text FK → organization                                                        | **new** (NOT NULL after backfill)                                    |
| status                               | LetterStatus default `pending`                                                | adds `closed`                                                        |
| message                              | text                                                                          | the note: 40-400 characters for new letters; old rows grandfathered  |
| isPriority                           | boolean default false                                                         | **new**                                                              |
| priorityUntil                        | timestamp                                                                     | **new**                                                              |
| creditsSpent                         | integer default 0                                                             | **new** (extra note plus priority)                                   |
| bidAmount                            | integer default 0                                                             | **deprecated**: never read or written again; dropped after migration |
| suggestionId                         | text FK → note_suggestion                                                     | **new**                                                              |
| safetyFlag                           | jsonb `{ category: SafetyCategory, reason: string, source: 'rules' \| 'ai' }` | **new**                                                              |
| declineMode                          | DeclineMode                                                                   | **new**                                                              |
| declineNote                          | text (≤ 400)                                                                  | **new**                                                              |
| respondedAt, closedAt                | timestamp                                                                     | **new**                                                              |
| createdAt, updatedAt                 | timestamp                                                                     | —                                                                    |

### 6.9 `note_suggestion` [New]

`id`, `organizationId`, `toProfileId`, `line` text (≤ 160), `basedOn` FitKey[],
`source` ('ai' | 'template'), `createdAt`. It is used by the server's verbatim check.

### 6.10 `match` [New] (an "introduction")

| Field                                              | Type                                       | Notes                                                                     |
| -------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| id                                                 | text PK                                    | —                                                                         |
| interestId                                         | text FK → interest, UNIQUE, cascade        | the letter that became the introduction                                   |
| pairKey                                            | text UNIQUE                                | the sorted `userAId:userBId`, so there is never a second match for a pair |
| userAId, organizationAId                           | text FK                                    | the sender                                                                |
| userBId, organizationBId                           | text FK                                    | the acceptor                                                              |
| stage                                              | IntroductionStage default `introduced`     | —                                                                         |
| sealsSeenByAAt, sealsSeenByBAt                     | timestamp                                  | the break plays once per side                                             |
| phoneSharedByA, phoneSharedByB                     | boolean default false                      | —                                                                         |
| familySharedByA, familySharedByB                   | boolean default false                      | —                                                                         |
| lastMessageAt                                      | timestamp                                  | drives ordering and the 7-day nudge                                       |
| closedAt, closedByUserId, closingNote, closeReason | timestamp, text, text (≤ 400), CloseReason | —                                                                         |
| createdAt, updatedAt                               | timestamp                                  | —                                                                         |

### 6.11 `call_proposal` [New]

| Field                        | Type                                                                        | Notes                                            |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| id                           | text PK                                                                     | —                                                |
| matchId                      | text FK → match, cascade                                                    | —                                                |
| proposedByUserId             | text FK, NULL                                                               | null means proposed by Rishta (the introduction) |
| slots                        | timestamp with time zone[] (exactly 3, future, distinct, 30-minute aligned) | —                                                |
| timeZoneA, timeZoneB         | text (IANA)                                                                 | snapshot for display                             |
| availabilityA, availabilityB | smallint[] (slot indexes)                                                   | a user proposer's own side is `{0,1,2}`          |
| status                       | CallProposalStatus default `open`                                           | —                                                |
| bookedSlot                   | timestamp with time zone                                                    | —                                                |
| note                         | text (≤ 200)                                                                | —                                                |
| createdAt, answeredAt        | timestamp                                                                   | —                                                |

### 6.12 `message` [Evolve]

Kept: `fromUserId`, `toUserId`, `content` (≤ 2000), `read`, `createdAt`.
New: `matchId` FK → match (NOT NULL after backfill), `safetyFlag` jsonb.
New index: (`matchId`, `createdAt`).

### 6.13 `shortlist` [Evolve] ("kept pages")

Kept: `userId`, `profileUserId`, `createdAt`. New: `organizationId` (the reader household) and
`keptByUserId` (the candidate or a family member: "Kept by Ammi"). The unique index changes from
(userId, profileUserId) to (organizationId, profileUserId).

### 6.14 `profile_view` [Evolve] ("readers")

Kept: `viewerUserId`, `profileUserId` (unique pair), `createdAt`. New: `viewerOrganizationId`. No row
is written when the reader's household has `readIncognito = true`.

### 6.15 `block_user` [Kept]

`blockerUserId`, `blockedUserId`, `reason`, `createdAt`. New: `organizationId` (the blocker's
household). It is enforced in folio generation, `getPage`, letters, messages, readers and family
links, in both directions.

### 6.16 `report` [New]

| Field                 | Type                                         |
| --------------------- | -------------------------------------------- |
| id                    | text PK                                      |
| reporterUserId        | text FK, NULL (null when from a family link) |
| reporterFamilyLinkId  | text FK, NULL                                |
| reportedUserId        | text FK, NULL                                |
| reportedProfileId     | text FK                                      |
| category              | ReportCategory                               |
| context               | ReportContext                                |
| contextId             | text                                         |
| details               | text (≤ 2000)                                |
| status                | ReportStatus default `open`                  |
| moderatorNote         | text                                         |
| resolvedByUserId      | text FK                                      |
| resolvedAt, createdAt | timestamp                                    |

### 6.17 `wallet` [Evolve] and `credit_ledger` [New]

`wallet`: kept `credits` (default 10), `totalSpent`, `userId` (legacy). New: `organizationId`
UNIQUE (a household wallet).

`credit_ledger`:

- `id`, `walletId` FK, `organizationId`, `delta` integer, `reason` LedgerReason
- `interestId` FK, NULL; `purchaseId` FK, NULL, UNIQUE (webhook idempotency)
- `createdByUserId`, `createdAt`

The balance always equals the wallet credits, updated in the same transaction.

### 6.18 `family_link` [New]

| Field                                  | Type                                               |
| -------------------------------------- | -------------------------------------------------- |
| id                                     | text PK                                            |
| organizationId                         | text FK (the sharing household)                    |
| createdByUserId                        | text FK                                            |
| profileId                              | text FK (the page shared)                          |
| letterId                               | text FK → interest, NULL (when "include his note") |
| tokenHash                              | text UNIQUE (SHA-256 hex)                          |
| recipientLabel                         | text (≤ 40)                                        |
| language                               | PageLanguage                                       |
| expiresAt                              | timestamp NOT NULL                                 |
| revokedAt, firstOpenedAt, lastOpenedAt | timestamp                                          |
| openCount                              | integer default 0                                  |
| createdAt                              | timestamp                                          |

### 6.19 `margin_note` [New] ("pencil notes")

| Field                | Type                                                |
| -------------------- | --------------------------------------------------- |
| id                   | text PK                                             |
| organizationId       | text FK (the household whose margin it is)          |
| profileId            | text FK (the page it sits beside)                   |
| authorUserId         | text FK, NULL                                       |
| familyLinkId         | text FK, NULL, unique per (familyLinkId, profileId) |
| authorLabel          | text (≤ 40) ("Ammi")                                |
| reaction             | FamilyReaction, NULL                                |
| text                 | text (≤ 280), NULL                                  |
| createdAt, updatedAt | timestamp                                           |

A row needs a reaction or text or both. A note whose author is the household's candidate is a
private note to self (§13): the API returns it to the candidate only. Privacy follows the author
(`authorUserId` is the claimed page's `userId`), so no column records it.

### 6.20 `biodata_translation` [New]

`id`, `profileId` FK cascade, `language` PageLanguage, `sourceUpdatedAt` timestamp, `content` jsonb
(`TranslatedPage`), `model` text, `createdAt`. Unique on (profileId, language, sourceUpdatedAt).

### 6.21 Relations (summary)

- organization 1-1 biodata_profile, household_setting and wallet
- organization 1-n member, folio, family_link and margin_note
- biodata_profile 1-n biodata_photo, folio_page and biodata_translation
- interest 1-0..1 match; match 1-n call_proposal and message
- wallet 1-n credit_ledger
- Every table cascades on the delete of its user or organization, which F13 relies on.

---

## 7. Matching: eligibility, fit reasons and ordering (deterministic)

Code: `packages/api/modules/folio/lib/fit.ts` (pure functions, unit-tested). AI never scores.

**Eligibility** (all must hold for page P to enter household H's folio):

1. P is `active`, claimed and published, and belongs to another household.
2. Gender:
    - P's gender is H's `seeking`, and H's candidate's gender is P's `seeking`.
3. No block in either direction. No letter in either direction (any status).
4. H has not passed P in the last 90 days. P has appeared in H's folios at most twice before, and if
   it appeared before, it was at least 3 days ago.
5. **Mutual dealbreakers.**
    - Every FitKey in H's `dealbreakers` evaluates to `fits` or `unknown` for P.
    - Every FitKey in P's `dealbreakers` evaluates to `fits` or `unknown` for H's candidate.
    - Recipients are therefore never shown to, or written to by, people their own dealbreakers
      exclude, which cuts unwanted notes at the source.
6. Exposure cap: P appears in at most 40 folios per day. This is a tunable constant and an
   assumption. It spreads attention so popular pages are not flooded.

**Fit reasons** (each key yields `fits`, `gap` or `unknown`; `unknown` when either side didn't
state it):

| Key            | Fits when                                                                        | Example copy (i18n)                                                                                                  |
| -------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| timeline       | the buckets differ by ≤ 1 (3m < 6m < 1y < 2y+)                                   | "You both hope to marry within a year." / "He hopes to marry within 6 months; you within a year."                    |
| religion       | P's religion ∈ H's religions (skipped if H listed none)                          | "Hindu, which you listed."                                                                                           |
| diet           | P's diet ∈ H's diets                                                             | "He's vegetarian, as you are." / gap: "Diet differs: you're vegetarian, he isn't."                                   |
| age            | within [ageMin, ageMax]                                                          | "He's 32, within the ages you gave."                                                                                 |
| marital_status | P's status ∈ H's list                                                            | —                                                                                                                    |
| location       | P's city or country matches H's places, **or** either side is open to relocating | "He's open to relocating; you're in Edison." / gap: "He'd rather not relocate, and you live in different countries." |
| residency      | H requires citizen/PR and P is a citizen or permanent resident                   | "Residency: as you asked." (the status itself is never shown if Matching only)                                       |
| education      | P's level ∈ H's levels                                                           | —                                                                                                                    |
| community      | P's community ∈ H's communities (only if H listed some)                          | "Community: not stated on his page."                                                                                 |
| language       | shared mother tongue or languages                                                | "You both speak Punjabi." (fits only; never a gap)                                                                   |
| height         | within [heightMin, heightMax]                                                    | —                                                                                                                    |

The folio shows 2-6 reasons: H's dealbreakers first, then gaps, then fits, then unknowns.

**Ordering score** (internal, stored on `folio_page.score`, never returned):

- +3 for each nice-to-have that fits, −2 for each gap, 0 for unknown.
- Values budget tie-breakers (an assumption; the budget never rates looks):
    - `valuesFinancial` × 0.5 if P states education and work
    - `valuesPersonality` × 0.5 if P's About and Looking-for together exceed 300 characters
    - `valuesLooks` × 0.5 if P has a photo visible `after_note` or to everyone
- +1 if P was published in the last 14 days.
- A stable daily tiebreak hash of (H, P, date), so equal pages rotate fairly.
- There is no paid placement of any kind. Priority notes affect only the order of the recipient's
  letters, and are labelled.

---

## 8. API surface (oRPC)

Root router: `packages/api/orpc/router.ts`. Procedures live in `packages/api/modules/<module>/procedures`.
All are `protectedProcedure` unless marked **public** or **admin**. Every household-scoped procedure
takes `organizationId`, calls `verifyOrganizationMembership` and checks the role:

- **O**: owner only
- **G**: owner or guardian (admin)
- **M**: any member

All inputs are zod-validated. Errors are `ORPCError` with a stable code in `data.code`.

Shared output types (`packages/api/modules/biodata/types.ts`):

```ts
type PageRelationship =
	| "self"
	| "household"
	| "stranger"
	| "i_wrote"
	| "wrote_to_me"
	| "introduced"
	| "family_link";
interface PageView {
	handle: string;
	ref: string; // "7KQ-2M9"
	relationship: PageRelationship;
	status: BiodataStatus;
	language: PageLanguage;
	dir: "ltr" | "rtl";
	invocation: { kind: Invocation; text?: string } | null;
	header: {
		displayName: string;
		age: number;
		birthMonthYear: string;
		heightCm?: number;
		city?: string;
		country?: string;
		signer: {
			createdBy: PageAuthor;
			confirmedByCandidate: boolean;
			candidateFirstName: string;
		};
		verification: Verification;
	};
	sections: Array<{
		id: "personal" | "education" | "family" | "lifestyle" | "about" | "looking_for";
		fields: Array<{ key: string; value: string | string[] }>;
		text?: string;
	}>;
	photos: Array<{ id: string; url: string; veiled: boolean; width: number; height: number }>;
	sealed: { open: false } | { open: true; fields: Array<{ key: string; value: string }> };
	updatedAt: string;
}
interface FitReason {
	key: FitKey;
	verdict: "fits" | "gap" | "unknown";
	params: Record<string, string>;
}
```

### households [New]

| Procedure                    | Input                                                                                                                  | Output                                                                                                                                 | Rules                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `households.create`          | `{ candidateRelation: CandidateRelation, candidateFirstName: string(1-40), candidateEmail?: email, timeZone: string }` | `{ organizationId, slug, handle, status }`                                                                                             | Creates organization, member (owner), household_setting, draft page, wallet (+10 welcome), and invitation if an email is given               |
| `households.get`             | `{ organizationSlug }`                                                                                                 | `{ id, slug, role, candidate: { userId \| null, firstName }, pageStatus, settings, plan: 'free' \| 'premium', seatsUsed, seatsLimit }` | M; an unknown slug answers `NOT_A_MEMBER`, exactly as a household you are not in                                                             |
| `households.updateSettings`  | `{ organizationId, …Partial<HouseholdSetting> }`                                                                       | `HouseholdSetting`                                                                                                                     | O                                                                                                                                            |
| `households.inviteCandidate` | `{ organizationId, email }`                                                                                            | `{ invitationId }`                                                                                                                     | G, only while unclaimed                                                                                                                      |
| `households.claim`           | `{ organizationId }`                                                                                                   | `{ status: 'draft' }`                                                                                                                  | the invited user; verified email; 18+. Every other caller gets `CLAIM_NOT_FOR_YOU`, whether the household is missing, claimed or not pending |
| `households.declineClaim`    | `{ organizationId, note?: string(≤ 400) }`                                                                             | `{ ok: true }`                                                                                                                         | the invited user (as `claim`); deletes the draft                                                                                             |

Members and invitations use the existing `organizations` module and the Better Auth client, with the
household copy.

### profiles [Evolve] (the biodata)

| Procedure                                   | Input                                                                                                            | Output                                                                                                                                    | Rules                                                                                                                                                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles.me`                               | `{ organizationId }` (was `{}`)                                                                                  | full owner view + `completeness: Record<SectionId, { filled: number; total: number }>`                                                    | M (guardian and family get the household view)                                                                                                                                                                             |
| `profiles.upsert`                           | the existing full-form schema + new fields                                                                       | `BiodataProfile`                                                                                                                          | G (guardian only if `familyEditsPage` or unclaimed); kept for the guided first write                                                                                                                                       |
| `profiles.patch`                            | `{ organizationId, section: SectionId, values: <section schema>.partial() }` (a discriminated union per section) | `BiodataProfile`                                                                                                                          | same as upsert; in-place edits                                                                                                                                                                                             |
| `profiles.setVisibility`                    | `{ organizationId, field: VisibleField, visibility: FieldVisibility }`                                           | `{ fieldVisibility }`                                                                                                                     | O                                                                                                                                                                                                                          |
| `profiles.publish`                          | `{ organizationId }`                                                                                             | `{ status: 'active', publishedAt }`                                                                                                       | O; checks required fields, 18+, claimed, looking-for complete, verified email                                                                                                                                              |
| `profiles.pause` / `profiles.resume`        | `{ organizationId }`                                                                                             | `{ status }`                                                                                                                              | O                                                                                                                                                                                                                          |
| `profiles.getPage`                          | `{ handle, organizationId }`                                                                                     | `PageView` + `{ reasons?: FitReason[]; myLetter?: LetterSummary; theirLetter?: LetterSummary; kept: boolean; pencilNotes: MarginNote[] }` | replaces `get`; 404 if blocked, not active (unless self or household) or unclaimed. G and M read another household's page only if `familyReadsFolio`, as a stranger would: no letters, the seal shut, no candidate's notes |
| `profiles.trackView` → `profiles.trackRead` | `{ handle, organizationId }`                                                                                     | `{ tracked: boolean }`                                                                                                                    | skips self, household, incognito and blocked                                                                                                                                                                               |
| `profiles.viewers` → `profiles.readers`     | `{ organizationId, cursor?: string }`                                                                            | `{ items: Array<{ handle, displayName, age, city, readAt }>, nextCursor }`                                                                | O; excludes blocked                                                                                                                                                                                                        |
| `profiles.block`                            | `{ blockedUserId \| handle, reason?: string(≤ 400) }`                                                            | `{ blocked: boolean }`                                                                                                                    | kept (toggle); also closes pending letters between the pair quietly                                                                                                                                                        |
| `profiles.photos.createUploadUrl`           | `{ organizationId, contentType: 'image/jpeg' \| 'image/webp', variant: 'clear' \| 'veil' }`                      | `{ signedUploadUrl, storageKey }`                                                                                                         | G                                                                                                                                                                                                                          |
| `profiles.photos.add`                       | `{ organizationId, storageKey, veilKey, width, height, visibility? }`                                            | `BiodataPhoto`                                                                                                                            | G; max 5                                                                                                                                                                                                                   |
| `profiles.photos.update`                    | `{ photoId, visibility?, position? }`                                                                            | `BiodataPhoto`                                                                                                                            | G                                                                                                                                                                                                                          |
| `profiles.photos.remove`                    | `{ photoId }`                                                                                                    | `{ ok: true }`                                                                                                                            | G; deletes both storage objects                                                                                                                                                                                            |
| `profiles.browse`                           | —                                                                                                                | —                                                                                                                                         | **[Remove]**, replaced by `folio.today`                                                                                                                                                                                    |

Route handlers (not oRPC, since they return files):

- `GET /api/biodata/[handle]/pdf` and `GET /api/biodata/[handle]/image`: the same access rules as
  `getPage`, watermarked.
- `GET /api/calls/:proposalId/ics`: participants only; a closed Introduction or a block returns 404. Built as a Hono route in `packages/api/index.ts` (`matches/lib/call-invite.ts`), linked
  from the booked time on the Introduction.

### preferences [Evolve] (Looking for)

| Procedure            | Input                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Output              | Rules                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | --------------------- |
| `preferences.get`    | `{ organizationId }`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `PartnerPreference` | M                     |
| `preferences.upsert` | `{ organizationId, seeking, marriageTimeline, relocation, residencyRequirement, values: { looks, personality, financial } (each 1-10, `.refine(sum ≤ 12)`), ageMin, ageMax (18-80, min ≤ max), heightMin?, heightMax?, religions: Religion[], communities: string[], educationLevels: EducationLevel[], locations: string[], countries: string[], diet: Diet[], maritalStatus: MaritalStatus[], languages: string[], dealbreakers: FitKey[], complete?: boolean }` | `PartnerPreference` | O (G while unclaimed) |

### folio [New] (evolves `profiles.browse` and Discover)

| Procedure     | Input                                                                                       | Output                                                                                                                                                                                                          | Rules                                                                    |
| ------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `folio.today` | `{ organizationId }`                                                                        | `{ releaseDate, nextReleaseAt, size, locked?: 'awaiting_claim' \| 'unpublished', pages: Array<{ folioPageId, position, state, seenBefore, page: PageView, reasons: FitReason[], pencilNotes: MarginNote[] }> }` | M (family only if `familyReadsFolio`); lazily generates                  |
| `folio.mark`  | `{ folioPageId, state: 'read' \| 'kept' \| 'passed' \| 'unread', passReason?: PassReason }` | `{ state }`                                                                                                                                                                                                     | `kept` G; `passed` O; `read` M                                           |
| `folio.kept`  | `{ organizationId }`                                                                        | `Array<{ page: PageView, keptBy: string, keptAt, pencilNotes: MarginNote[], myLetter?: LetterSummary }>`                                                                                                        | M (family only if `familyReadsFolio`); `myLetter` for the candidate only |

`shortlists.toggle` and `shortlists.list` [Evolve] stay as thin aliases over kept pages
(household-scoped) for compatibility.

### interests [Evolve] (letters)

| Procedure                | Input                                                                                                                                                       | Output                                                                                                                                                     | Rules                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `interests.send` (seal)  | `{ organizationId, toHandle, note: string.trim().min(40).max(400), suggestionId?: string, priority: boolean, useCredit?: boolean, idempotencyKey: string }` | `{ letterId, sealedAt, notesLeftToday, credits }`                                                                                                          | O; the page is active; limits, credits, blocks, verbatim and contact rules; one transaction                |
| `interests.withdraw`     | `{ letterId }`                                                                                                                                              | `LetterSummary`                                                                                                                                            | O (sender), pending only                                                                                   |
| `interests.respond`      | `{ letterId, action: 'accept' \| 'decline', declineMode?: DeclineMode, declineNote?: string(≤ 400) }`                                                       | `{ letter: LetterSummary, match?: { id } }`                                                                                                                | O (recipient), pending only; accept creates the match and the system call proposal in the same transaction |
| `interests.list`         | `{ organizationId, box: 'waiting' \| 'introductions' \| 'sent' \| 'closed' }`                                                                               | `LetterSummary[]` (`{ letterId, otherHandle, otherName, otherAge, otherCity, state, firstLine, isPriority, safetyFlag?, hasFamilyReaction, updatedAt }`)   | O (G and M get `[]` or stage lines per settings)                                                           |
| `interests.get`          | `{ letterId }`                                                                                                                                              | `{ letter, direction: 'sent' \| 'received', note, signer, otherPage: PageView, reasons: FitReason[], safetyFlag?, pencilNotes, match?: IntroductionView }` | O of either household                                                                                      |
| `interests.counts`       | `{ organizationId }`                                                                                                                                        | `{ waiting: number, yourMove: number }`                                                                                                                    | O (the masthead number)                                                                                    |
| `interests.matches`      | —                                                                                                                                                           | —                                                                                                                                                          | **[Evolve]** → `matches.list` (kept as an alias during migration)                                          |
| `interests.profileStats` | —                                                                                                                                                           | —                                                                                                                                                          | **[Remove]** (a privacy leak and bid mechanics)                                                            |

### matches [New] (introductions)

| Procedure                 | Input                                                                                                                         | Output                                                                                                                                                                                 | Rules                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `matches.list`            | `{ organizationId }`                                                                                                          | `IntroductionSummary[]`                                                                                                                                                                | O                                                      |
| `matches.get`             | `{ matchId }`                                                                                                                 | `IntroductionView` (`{ id, stage, you, them: { page: PageView (sealed open), contact: { email, phone?, family? } }, proposals: CallProposal[], sealsSeenAt?: string, lastMessageAt }`) | a participant                                          |
| `matches.markSealsSeen`   | `{ matchId }`                                                                                                                 | `{ seenAt }`                                                                                                                                                                           | a participant (once)                                   |
| `matches.setAvailability` | `{ proposalId, slotIndexes: number[] (0-2) }`                                                                                 | `CallProposal`                                                                                                                                                                         | a participant; books when intersecting                 |
| `matches.proposeCall`     | `{ matchId, slots: [datetime, datetime, datetime] (future, distinct, 30-min aligned, within 21 days), note?: string(≤ 200) }` | `CallProposal`                                                                                                                                                                         | a participant; supersedes open proposals               |
| `matches.shareContact`    | `{ matchId, kind: 'phone' \| 'family' }`                                                                                      | `{ shared: true }`                                                                                                                                                                     | a participant; `families` stage when both share family |
| `matches.close`           | `{ matchId, closingNote: string(20-400), reason: CloseReason }`                                                               | `IntroductionSummary`                                                                                                                                                                  | a participant                                          |

### messages [Evolve]

| Procedure              | Input                                                                         | Output                             | Rules                                                           |
| ---------------------- | ----------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `messages.list`        | `{ matchId, cursor?: string }` (was `{ withUserId }`)                         | `{ items: Message[], nextCursor }` | a participant                                                   |
| `messages.send`        | `{ matchId, content: string.min(1).max(2000) }` (was `{ toUserId, content }`) | `Message`                          | gated on an **open match** (fixes the core loop); safety screen |
| `messages.markRead`    | `{ matchId }` (was `{ fromUserId }`)                                          | `{ success: true }`                | a participant                                                   |
| `messages.unreadCount` | `{}`                                                                          | `{ count }`                        | kept                                                            |

### familyLinks [New]

| Procedure            | Input                                                                                                                             | Output                                                                                                                                                                                                                                | Rules                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `familyLinks.create` | `{ organizationId, handle, recipientLabel: string(1-40), language: PageLanguage, expiresInDays: 1 \| 3 \| 7, letterId?: string }` | `{ url, expiresAt, shareText }` (the token is only ever in `url`)                                                                                                                                                                     | G; respects the other page's `familyLinksAllowed`; Free: 3 active |
| `familyLinks.list`   | `{ organizationId }`                                                                                                              | `Array<{ id, recipientLabel, pageName, language, expiresAt, openCount, reaction? }>`                                                                                                                                                  | G                                                                 |
| `familyLinks.revoke` | `{ linkId }`                                                                                                                      | `{ ok: true }`                                                                                                                                                                                                                        | G                                                                 |
| `familyLinks.open`   | `{ token }`                                                                                                                       | `{ state: 'open', page: PageView (stranger, translated), translated: boolean, original?: PageView, watermark: { recipientLabel, sharedBy, until }, note?: { text, signer }, myReaction?: { reaction, text } } \| { state: 'closed' }` | **public**; rate-limited; increments `openCount`                  |
| `familyLinks.react`  | `{ token, reaction?: FamilyReaction, text?: string(≤ 280) }`                                                                      | `{ ok: true }`                                                                                                                                                                                                                        | **public**; upserts the margin note; notifies the household       |
| `familyLinks.report` | `{ token, category: ReportCategory, details?: string }`                                                                           | `{ ok: true }`                                                                                                                                                                                                                        | **public**                                                        |

### margin [New] (pencil notes)

| Procedure       | Input                                                                                                       | Output         | Rules                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| `margin.list`   | `{ organizationId, handle }`                                                                                | `MarginNote[]` | M (another household's page only if `familyReadsFolio`); the candidate's own notes go to the candidate only |
| `margin.add`    | `{ organizationId, handle, reaction?: FamilyReaction, text?: string(≤ 280) }` (`.refine(reaction or text)`) | `MarginNote`   | M; a note the candidate writes is private to them (§13)                                                     |
| `margin.remove` | `{ noteId }`                                                                                                | `{ ok: true }` | the author, or O                                                                                            |

### reports [New]

| Procedure         | Input                                                                                                                   | Output                                  | Rules                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------- |
| `reports.create`  | `{ context: ReportContext, contextId: string, category: ReportCategory, details?: string(≤ 2000), alsoBlock: boolean }` | `{ reportId }`                          | any signed-in member |
| `reports.list`    | `{ status?: ReportStatus, cursor? }`                                                                                    | paginated reports with context snippets | **admin**            |
| `reports.resolve` | `{ reportId, status: 'reviewing' \| 'actioned' \| 'dismissed', moderatorNote?: string, pausePage?: boolean }`           | `Report`                                | **admin**            |

### wallet [Evolve]

| Procedure    | Input                           | Output                                             | Rules                                       |
| ------------ | ------------------------------- | -------------------------------------------------- | ------------------------------------------- |
| `wallet.get` | `{ organizationId }` (was `{}`) | `{ credits, ledger: CreditLedgerRow[] (last 20) }` | G; auto-creates with 10 and a `welcome` row |

Credit purchase: `payments.createCheckoutLink` (existing) with the credits price and
`organizationId`. The webhook grants the credits.

### ai [Evolve]

| Procedure             | Input                                                                                                                                                                                                   | Output                                                                  | Rules                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `ai.status`           | `{}`                                                                                                                                                                                                    | `{ enabled: boolean }`                                                  | whether `OPENAI_API_KEY` is configured (server-side check)        |
| `ai.draftBiodata`     | `{ organizationId, tone: 'warm' \| 'simple' \| 'formal', answers: { family: string(≤ 280), everyday: string(≤ 280), hopes: string(≤ 280) }, sections: ('aboutMe' \| 'aboutFamily' \| 'lookingFor')[] }` | `{ aboutMe?, aboutFamily?, lookingFor?, omittedPhrases: string[] }`     | G; 10 per household per day                                       |
| `ai.suggestFirstLine` | `{ organizationId, toHandle }`                                                                                                                                                                          | `{ suggestionId, line, basedOn: FitKey[], source: 'ai' \| 'template' }` | O; always returns (template fallback)                             |
| `ai.streamMessage`    | —                                                                                                                                                                                                       | —                                                                       | **[Remove]** (the template chatbot; its page was already deleted) |

Translation and safety screening are internal library functions (`packages/api/modules/ai/lib/`)
called by `familyLinks.open`, `interests.send` and `messages.send`. They are not exposed.

### Unchanged template modules

`admin` (plus the reports admin above), `organizations`, `users`, `payments` and `notifications`.

---

## 9. AI features

Model: `textModel` from `@repo/ai` (`openai("gpt-4o-mini")` today), via the Vercel AI SDK
`generateObject` with zod schemas. **Configured** means `process.env.OPENAI_API_KEY` is set. A helper
`isAiConfigured()` in `packages/ai` wraps this check, and `ai.status` exposes it to the UI. Each AI
call has a 12-second timeout and falls back on any error.

**a. Help me write (drafting the page)**

- **Where**: My Biodata, beside About me, About my family and Looking for ("Help me write" in the
  margin).
- **Inputs**: the page's structured fields (server-loaded; never the sealed fields), three short
  answers and a tone.
- **Rules**:
    - Writes in the first person (or third person if `createdBy` is not `self`, then confirmed by the
      candidate).
    - Uses only facts given. Makes no claims about looks and no complexion words.
    - Writes specifics, not "well-settled".
- **Output**:
    ```ts
    z.object({
    	aboutMe: z.string().max(1500).optional(),
    	aboutFamily: z.string().max(1200).optional(),
    	lookingFor: z.string().max(1200).optional(),
    });
    ```
- **Post-processing**: a deterministic denylist (fair, fair-skinned, wheatish, dusky, gora, gori,
  light-skinned, milky and similar) strips sentences, returned as `omittedPhrases` ("We left out words
  about complexion").
- **UI**: the draft appears in pencil in the field with [Use this draft] and [Try again]. It is never
  saved without the person choosing it.
- **Fallback**: "Three questions to start you off". Static prompts are inserted as pencil
  placeholders in the fields.

**b. A first line for the note**

- **Where**: the SealComposer, as a pencil suggestion.
- **Inputs**: the deterministic overlaps between the two pages (the `fits` reasons plus shared
  languages and regions), with both first names.
- **Output**:
    ```ts
    z.object({ line: z.string().min(20).max(160), basedOn: z.array(FitKeyEnum).min(1).max(3) });
    ```
    The line must cite only the given overlaps: no compliments on looks, no contact requests, no
    questions about income.
- It is stored as a `note_suggestion`. The server refuses a note that contains it verbatim.
- **Fallback** (no key or an error): an i18n template from the top overlap ("I noticed we both hope to
  marry within a year, and both our families are from Punjab."), with `source: 'template'` and the
  same verbatim rule.

**c. Translation for family**

- **Where**: `/f/[token]` (and "Preview as family link").
- **Inputs**: the stranger-redacted PageView and the target language.
- **Output**:
    ```ts
    z.object({
    	fields: z.array(z.object({ key: z.string(), value: z.string() })),
    	about: z.string().optional(),
    	aboutFamily: z.string().optional(),
    	lookingFor: z.string().optional(),
    	note: z.string().optional(),
    });
    ```
    Names and places are transliterated, never translated. Numbers stay in Western digits unless the
    language's bundle says otherwise.
- It is cached in `biodata_translation` by (profileId, language, sourceUpdatedAt). The note
  translation is cached per letter in memory only.
- **UI**: always labelled "Translated · show original". Field labels come from the human-reviewed
  `family` i18n bundle, never from AI.
- **Fallback**: the original values with translated labels, and "A translation isn't available right
  now."

**d. Safety screening of notes and messages**

- **Rules first** (deterministic regexes in `packages/api/modules/ai/lib/safety-rules.ts`):
    - money: wire, Western Union, gift card, crypto, "send me", loan
    - off-platform: WhatsApp, Telegram, Signal, phone or email patterns
    - visa: green card, sponsor, visa, papers
    - a small harassment lexicon
- **AI second**, only if configured, no rule matched, and the text is a note or one of the first 10
  messages of a match:
    ```ts
    z.object({
    	flag: z.boolean(),
    	category: z.enum(["money", "off_platform", "visa", "harassment", "none"]),
    	reason: z.string().max(140),
    });
    ```
- **UI**: a `SafetyNote` shown **to the recipient only**, with the reason and [Report] [Block]. Nothing
  is silently hidden, and the sender is not told. The only hard block is contact details in a **note**
  (F6).
- **Fallback**: rules only.

**Where AI must not go**:

- No rating of looks and no inference of complexion, caste, religiosity or family status.
- No generating, beautifying or retouching photos.
- No auto-interests, auto-answers, or messages sent on anyone's behalf.
- No persona pretending to be a matchmaker, and no chatbot tab.
- No summarising a candidate's messages for family.
- No ranking by engagement or paid placement.
- AI never computes fit.

---

## 10. Notifications and email

New `NotificationType` values, added in both Drizzle (`notificationTypeEnum`) and Prisma, and to
`packages/notifications/src/catalog.ts` in the groups `letters`, `family` and `folio`:

| Type                                   | To                                 | In-app                                                                                    | Email (default)                                                                  | Subject (discreet)                                                     | Link                            |
| -------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| `LETTER_RECEIVED`                      | the recipient's candidate          | "A new letter is waiting."                                                                | on                                                                               | "A letter is waiting for you"                                          | `/letters/[letterId]`           |
| `LETTER_ANSWERED` (yes)                | the sender's candidate             | "Your letter has an answer. The seals are broken."                                        | on                                                                               | "Your letter has an answer"                                            | `/letters/[letterId]`           |
| `LETTER_ANSWERED` (declined or closed) | the sender's candidate             | "Your letter has an answer."                                                              | **off** (no painful emails at 11 p.m.)                                           | —                                                                      | `/letters/[letterId]`           |
| `CALL_PROPOSED`                        | the other participant              | "A time has been proposed."                                                               | on                                                                               | "A time has been proposed"                                             | `/letters/[letterId]`           |
| `CALL_BOOKED`                          | both                               | "Your call is booked for Thu 2 Oct, 8:00 pm."                                             | on, with `.ics` (or a link to `/api/calls/:proposalId/ics`)                      | "Your call is booked"                                                  | `/letters/[letterId]`           |
| `INTRODUCTION_CLOSED`                  | the other participant              | "A conversation has closed."                                                              | on                                                                               | "A conversation has closed"                                            | `/letters/[letterId]`           |
| `FAMILY_REACTION`                      | the candidate                      | "Ammi left a pencil note on a page."                                                      | off                                                                              | "A note from your family"                                              | `/[slug]/folio/kept`            |
| `CLAIM_REQUESTED`                      | the invited candidate (email only) | —                                                                                         | on                                                                               | "Your mother has started a page for you" (explicit by design: consent) | `/organization-invitation/[id]` |
| `PAGE_CLAIMED` / `CLAIM_DECLINED`      | the drafter                        | "Priya confirmed her page." / "Priya would rather not have a page. Thank you for caring." | on                                                                               | "About the page you started"                                           | `/[slug]`                       |
| `FOLIO_READY`                          | the candidate                      | —                                                                                         | **off** (opt-in digest, sent from a Vercel cron at the household's release hour) | "Your evening folio is ready"                                          | `/[slug]`                       |

- Email templates go in `packages/mail/emails/`: `LetterReceived.tsx`, `LetterAnswered.tsx`,
  `CallProposed.tsx`, `CallBooked.tsx`, `IntroductionClosed.tsx`, `FamilyReaction.tsx`,
  `ClaimRequested.tsx` and `ClaimResult.tsx`.
- They are set in the product's paper style. The sender name is "Rishta". The body never shows photos.
  With `discreetEmails` on, the body also omits names and says only "Open Rishta to read it."
- Email verification (`EmailVerification.tsx`) is re-enabled with Resend (the existing TODO).

---

## 11. Billing plans (`packages/payments/config.ts`)

Pricing facts carried over: $29/month, $290/year, a 7-day trial, 10 free credits and 3 interests a
day free. The $5 "24-hour boost" was never launched; its price point becomes the credit pack. Billing
stays attached to the **organization** (the household), so a parent can pay for their child's
household.

```ts
export const config: PaymentsConfig = {
	billingAttachedTo: "organization",
	requireActiveSubscription: false,
	plans: {
		free: { isFree: true },
		premium: {
			recommended: true,
			prices: [
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_PRO_MONTHLY as string,
					interval: "month",
					amount: 29,
					currency: "USD",
					seatBased: false,
					trialPeriodDays: 7,
				},
				{
					type: "subscription",
					priceId: process.env.PRICE_ID_PRO_YEARLY as string,
					interval: "year",
					amount: 290,
					currency: "USD",
					seatBased: false,
					trialPeriodDays: 7,
				},
			],
		},
		credits: {
			hidden: true, // bought from Credits & plan, not the plan table
			prices: [
				{
					type: "one-time",
					priceId: process.env.PRICE_ID_CREDITS_5 as string,
					amount: 5,
					currency: "USD",
				},
			],
		},
		// enterprise removed: a paid matchmaker seat is out of scope
	},
};
```

The plan key changes from `pro` to `premium`. The env var names stay, so the deployment needs no
change beyond adding `PRICE_ID_CREDITS_5`.

| Entitlement                                           | Free            | Premium                                                     |
| ----------------------------------------------------- | --------------- | ----------------------------------------------------------- |
| Folio size each evening                               | 5 pages         | 7 pages                                                     |
| Notes per day                                         | 3               | 10                                                          |
| Extra note or priority note                           | 1 credit each   | 1 credit each; 2 credits added each month (`monthly_grant`) |
| Household seats                                       | candidate + 2   | candidate + 6                                               |
| Active family links                                   | 3               | unlimited                                                   |
| Translation on family links                           | yes             | yes                                                         |
| PDF and WhatsApp export                               | yes             | yes                                                         |
| Safety (blocks, reports, incognito, veils, screening) | **always free** | always free                                                 |

Enforcement lives in `packages/api/modules/households/lib/entitlements.ts`. It reads the household's
active purchase through `createPurchasesHelper`, fixing today's user-level check. Auto-renewal terms
and online cancellation go through the Stripe customer portal (`CustomerPortalButton`), as ROSCA and
the California rules require.

---

## 12. Pages and routes (they match design.md §3.3)

| Route                                     | File                                                                                                                                                                                  | Feature                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `/`                                       | `app/(authenticated)/(main)/(account)/page.tsx`                                                                                                                                       | redirect to `/[activeSlug]`                                |
| `/onboarding`                             | `app/(authenticated)/onboarding/page.tsx`                                                                                                                                             | F1                                                         |
| `/new-organization`                       | `app/(authenticated)/new-organization/page.tsx`                                                                                                                                       | F1 ("Start a page for someone else")                       |
| `/organization-invitation/[invitationId]` | existing                                                                                                                                                                              | F2, F11                                                    |
| `/[organizationSlug]`                     | `app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx`                                                                                                              | F5 Folio                                                   |
| `/[organizationSlug]/folio/kept`          | `…/[organizationSlug]/folio/kept/page.tsx`                                                                                                                                            | F5 Kept pages                                              |
| `/[organizationSlug]/letters`             | `…/[organizationSlug]/letters/page.tsx`                                                                                                                                               | F7                                                         |
| `/[organizationSlug]/letters/[letterId]`  | `…/[organizationSlug]/letters/[letterId]/page.tsx`                                                                                                                                    | F6-F9                                                      |
| `/[organizationSlug]/biodata`             | `…/[organizationSlug]/biodata/page.tsx`                                                                                                                                               | F4                                                         |
| `/[organizationSlug]/biodata/looking-for` | `…/[organizationSlug]/biodata/looking-for/page.tsx`                                                                                                                                   | F3                                                         |
| `/[organizationSlug]/biodata/readers`     | `…/[organizationSlug]/biodata/readers/page.tsx`                                                                                                                                       | F16                                                        |
| `/[organizationSlug]/begin`               | `…/[organizationSlug]/begin/page.tsx`                                                                                                                                                 | F3                                                         |
| `/[organizationSlug]/claim`               | `…/[organizationSlug]/claim/page.tsx`                                                                                                                                                 | F2                                                         |
| `/[organizationSlug]/close`               | `…/[organizationSlug]/close/page.tsx`                                                                                                                                                 | F13                                                        |
| `/[organizationSlug]/settings/general`    | existing                                                                                                                                                                              | F11 household settings                                     |
| `/[organizationSlug]/settings/members`    | existing                                                                                                                                                                              | F11                                                        |
| `/[organizationSlug]/settings/billing`    | existing                                                                                                                                                                              | F14                                                        |
| `/b/[handle]`                             | `app/(authenticated)/(main)/(links)/b/[handle]/page.tsx`                                                                                                                              | a single page (chrome-free)                                |
| `/letters/[letterId]`                     | `app/(authenticated)/(main)/(links)/letters/[letterId]/page.tsx`                                                                                                                      | a letter (chrome-free, from email)                         |
| `/f/[token]`                              | `app/(public)/f/[token]/page.tsx` + `app/(public)/layout.tsx`                                                                                                                         | F10 (no account)                                           |
| `/settings/*`                             | existing `(account)/settings/*`                                                                                                                                                       | account settings (+ appearance, shortcuts, discreet email) |
| `/admin/reports`                          | `app/(authenticated)/(main)/(account)/admin/reports/page.tsx`                                                                                                                         | F12 moderation                                             |
| API routes                                | `app/api/biodata/[handle]/pdf/route.ts`, `app/api/biodata/[handle]/image/route.ts`, `/api/calls/:proposalId/ics` (Hono, `packages/api/index.ts`), `app/api/cron/folio-ready/route.ts` | F4, F9, F15                                                |

- Legacy `(account)` product pages (`/quiz`, `/profile`, `/profile/edit`, `/browse/[userId]`,
  `/interests`, `/matches`, `/matches/[userId]`, `/messages`, `/shortlist`, `/preferences`,
  `/viewers`, `/activity`, `/premium`) redirect as listed in design.md §3.4, via `next.config.ts`
  redirects or thin server redirect pages. Their components are then removed.
- `(account)/layout.tsx` (the client-side gate plus the sidebar) is replaced by the server gate in
  `[organizationSlug]/layout.tsx` (design.md §3.5).

---

## 13. Roles and permissions

Better Auth organization roles map to household roles: **owner** = the candidate (after claim),
**admin** = a guardian (a parent, or a sibling co-managing), **member** = family. The family link is
a separate, account-less audience. Platform **admin** is `user.role = 'admin'`.

| Action                                               | Candidate (owner)                                       | Guardian (admin)                             | Family (member)                          | Family link          | Platform admin                          |
| ---------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------- | ---------------------------------------- | -------------------- | --------------------------------------- |
| Read the folio and kept pages                        | ✓                                                       | ✓ if `familyReadsFolio`                      | ✓ if `familyReadsFolio`                  | only the shared page | —                                       |
| Keep a page                                          | ✓                                                       | ✓ ("Kept by Ammi")                           | ✗                                        | ✗                    | —                                       |
| Pass a page                                          | ✓                                                       | ✗                                            | ✗                                        | ✗                    | —                                       |
| **Seal a note, say yes, decline, withdraw, close**   | ✓                                                       | ✗                                            | ✗                                        | ✗                    | —                                       |
| Pencil notes and reactions                           | ✓ (private notes to self: only the candidate sees them) | ✓                                            | ✓                                        | ✓ (one per link)     | —                                       |
| Create or revoke family links                        | ✓                                                       | ✓                                            | ✗                                        | ✗                    | —                                       |
| Edit the page                                        | ✓                                                       | ✓ if `familyEditsPage` (always before claim) | ✗                                        | ✗                    | pause only                              |
| Edit looking-for                                     | ✓                                                       | before claim only (as a draft)               | ✗                                        | ✗                    | —                                       |
| Publish, pause, resume, set field visibility, photos | ✓                                                       | photos if `familyEditsPage`                  | ✗                                        | ✗                    | pause (via report)                      |
| Letters list                                         | ✓                                                       | stage lines if `familySeesIntroductions`     | stage lines if `familySeesIntroductions` | ✗                    | via reports only                        |
| Messages                                             | ✓                                                       | **never**                                    | **never**                                | **never**            | via reports only (the reported message) |
| Readers                                              | ✓                                                       | ✗                                            | ✗                                        | ✗                    | —                                       |
| Invite members                                       | ✓                                                       | ✓ (member role)                              | ✗                                        | ✗                    | —                                       |
| Change roles, remove members, household settings     | ✓                                                       | ✗                                            | ✗                                        | ✗                    | —                                       |
| Billing and credits                                  | ✓                                                       | ✓                                            | ✗                                        | ✗                    | —                                       |
| Close my search, delete                              | ✓                                                       | ✗                                            | ✗                                        | ✗                    | —                                       |
| Report, block                                        | ✓ (report + block)                                      | report                                       | report                                   | report               | resolve                                 |
| Claim a page                                         | the invited candidate                                   | —                                            | —                                        | —                    | —                                       |

The candidate's consent is final and visible. Nothing a family member does changes a letter's state
or sends anything to another household, except a family link the owner or a guardian chose to create.

---

## 14. Seed and demo data plan

Script: `packages/database/drizzle/seed/index.ts`.

- Package script: `"seed": "dotenv -c -- tsx drizzle/seed/index.ts"`, run with
  `pnpm --filter @repo/database seed`. Never run it against production.
- It is idempotent: it deletes and recreates everything under `@demo.rishta.test` emails.
- Passwords come from `SEED_DEMO_PASSWORD`, or one is generated and printed.
- Dates are relative to the run time, and each household's "today" is local.
- Photos are DiceBear portraits (as in the existing seed), referenced as `external:` storage keys and
  served through the same veil and clear rules.
- It replaces the missing seed script behind `testing.md`, and keeps its 12 multicultural people.

**Demo logins**

| Login                      | Role                                                  | Why                                                                       |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| `priya@demo.rishta.test`   | candidate, household `priya-demo` (Premium, trialing) | the recipient side: every letter and folio state                          |
| `sunita@demo.rishta.test`  | Priya's mother, guardian ("Ammi")                     | the guardian view, pencil notes, kept for Priya                           |
| `kabir@demo.rishta.test`   | Priya's brother, family ("Bhaiya")                    | the family member view                                                    |
| `omar@demo.rishta.test`    | candidate, household `omar-demo` (Free)               | the sender side: daily limit reached, seals broken from the sender's side |
| `nasreen@demo.rishta.test` | guardian who drafted Ali Khan's page (awaiting claim) | the claim flow, the locked folio                                          |
| `admin@demo.rishta.test`   | platform admin                                        | `/admin/reports`                                                          |

**Priya Sharma**

- 29, pharmacist, Edison NJ (America/New_York), Punjabi Hindu, vegetarian, never married.
- Page: invocation ॥ श्री गणेशाय नमः ॥, `pageLanguage` en, verified email, 3 photos (`after_yes`),
  workplace and income sealed.
- Looking for:
    - timeline `1_year`; seeking men; age 28-36
    - religions hindu, sikh, jain; diet veg, eggetarian, jain_veg (both nice-to-have)
    - relocation `within_country`
    - dealbreakers: timeline, age, marital_status (never_married or divorced)
    - values: personality 6, financial 4, looks 2

**Other households (candidates)**

- Men:
    - from the existing seed: Omar Hassan (Egyptian, Muslim, Baltimore), David Cohen (New York),
      Andrei Volkov (London), Jin Park (Seoul / LA), Rahul Patel (Gujarati Hindu, Seattle), Ali Khan
      (Pakistani Muslim, Dallas; page drafted by his mother, **awaiting claim**)
    - new: Arjun Mehta (Punjabi Hindu doctor, Toronto), Nikhil Rao (Telugu Hindu, Dallas,
      America/Chicago), Sameer Joshi (Marathi Hindu, Houston), Harpreet Singh Gill (Sikh, Brampton), Dev
      Shah (Jain, Jersey City), Vikram Iyer (Tamil Hindu, Chicago), Karan Bhatia (London; writes the
      flagged note), Rohan Kapoor (Punjabi Hindu, New York), Aditya Menon (Boston), Hamza Siddiqui
      (Chicago; **Urdu page, RTL**), Manpreet Singh Sandhu (Vancouver), Siddharth Bose (Philadelphia;
      **Bengali page**), Ishaan Verma (Chicago), Tejas Kulkarni (Pune; relocating), Neel Desai (Gujarati Jain, Edison), Kunal
      Arora (blocked by Priya)
- Women, from the existing seed:
    - Maria Santos (Miami; **closed search: engaged**)
    - Yuki Tanaka (San Francisco; **paused**)
    - Fatima Ali (Toronto; `createdBy` parent; her father Abdi is guardian; claimed, so the signer line
      reads "Written by her father, confirmed by Fatima")
    - Amara Okafor (Austin), Sofia Martinez (Chicago)
- Women, new: Priya Sharma (above) and Zainab Qureshi (Chicago; Urdu page).

**States covered for Priya (every state in design.md §5)**

| Area                        | Records                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Today's folio (7)           | Rohan Kapoor **kept** · Aditya Menon **read** · Hamza Siddiqui **read** (Urdu RTL, faith gap) · Manpreet Singh Sandhu **passed** (reason `distance`) · Dev Shah **noted** (Priya sealed a note today) · Siddharth Bose **unread** (Bengali page) · Ishaan Verma **unread, seen before**                                                                                             |
| Earlier folios              | 3 days of history, so "seen before" and "Passed pages" work                                                                                                                                                                                                                                                                                                                         |
| Kept pages (3)              | Rohan (Ammi via link **Proceed**, "Good family. Ask about his parents' plans to move."; Kabir in the app **Let's talk**) · Tejas Kulkarni (Sunita in the app **Not for us**, "Too far from home") · Vikram Iyer (also written to)                                                                                                                                                   |
| Waiting for your answer (4) | Rahul Patel (**12 days**, oldest) · Arjun Mehta (**priority note**, 1 day, priority until +47h) · Karan Bhatia (**safety flag** `money` + `off_platform`, rules source; Priya's **report** is open) · Omar Hassan (today)                                                                                                                                                           |
| Introductions (3)           | Harpreet Singh Gill: Priya wrote 3 days ago and **he said yes today**; `sealsSeenByA` is null, so **the break plays on Priya's first open** · Nikhil Rao (Dallas): stage `introduced`, a system proposal where Nikhil ticked slot 2, **waiting for Priya**, 4 messages · Sameer Joshi (Houston): **call booked** Thursday at 8:00 pm Edison / 7:00 pm Houston, 8 messages, 2 unread |
| Your sealed notes (2)       | Dev Shah (today) · Vikram Iyer (5 days, sent as a priority note whose window has passed)                                                                                                                                                                                                                                                                                            |
| Closed (4)                  | Jin Park **declined with a kind note** · David Cohen **closed quietly** · Andrei Volkov wrote, **Priya declined kindly** · Neel Desai (Edison) wrote 34 days ago and the letter **auto-closed after 30 days** unanswered                                                                                                                                                            |
| Family links (3)            | "Ammi", Hindi, Rohan's page, open 5 more days, opened twice, reacted · "Nani", Punjabi, Arjun's letter with the note, **expired** · "Masi", created by Sunita, **revoked**                                                                                                                                                                                                          |
| Translations                | Precomputed `biodata_translation` rows (static content) for Rohan → hi and Arjun → pa, so family links work with no AI key                                                                                                                                                                                                                                                          |
| Readers                     | Arjun, Rahul, Karan, Omar and Harpreet read her page. Kunal read it but is **blocked**, so he is hidden. Aditya read it incognito, so there is no row.                                                                                                                                                                                                                              |
| Wallet                      | 10 welcome, −1 priority note (to Vikram), so **9 credits**, with 2 ledger rows                                                                                                                                                                                                                                                                                                      |
| Notifications               | LETTER_RECEIVED (Omar), LETTER_ANSWERED (Harpreet yes), CALL_PROPOSED (Nikhil), FAMILY_REACTION (Ammi); 2 unread                                                                                                                                                                                                                                                                    |

**States covered for Omar**

- Free plan, **3 notes sealed today** (to Priya, Zainab Qureshi and Amara Okafor), so the daily limit is
  reached and the seal shows the credit option. Wallet 10.
- His folio has 5 pages, including Sofia Martinez and a page for which he has no eligible match
  reasons beyond the timeline.
- An introduction with Maria Santos **closed by her search closing** ("I've closed my search. Thank
  you, and I wish you well.").
- A letter from Fatima Ali **declined by Omar, quietly**.

**Other states**

- Ali Khan's household (Nasreen): an `awaiting_claim` page with a pending invitation to
  `ali@demo.rishta.test`, the folio locked, and a looking-for draft.
- Yuki is paused. Maria is closed (engaged, with a story).
- Admin: 1 open report (Priya → Karan), 1 dismissed (historic).

---

## 15. Migration from the current build

No agent runs migrations against a database. Generate them (`drizzle-kit generate`) and review them.
There is no local Postgres. Order:

1. **Schema, additive**: new enums and tables, new nullable columns, the `biodata_profile.userId`
   NOT NULL dropped.
2. **Backfill** (a one-off script in `packages/database/drizzle/migrations-data/`):
    - Households: for each `biodata_profile`, create an organization (neutral slug), a member (the
      owner), a household_setting (`candidateRelation` from `createdBy`) and a `handle`. Then set
      `organizationId`, `status` (`isActive` true → active, false → paused), `verification` and
      `timeZone` (from `location` where it can be resolved, otherwise `America/New_York` as an
      assumption, prompting on the next visit).
    - `partner_preference`: split the CSV into arrays and map diet text ("vegetarian" → `veg`,
      "halal" → `halal`, "any" → none). Map the booleans to `relocation` and `residencyRequirement`.
      Set `completedAt` from `quizComplete`.
    - `interest`: set the organization ids and `creditsSpent = bidAmount`. Clear `isPriority`, since
      bids end with no refund needed because credits were free.
    - Matches: create a `match` for every accepted interest, whether one-directional or mutual. This
      fixes the stuck pairs.
    - `message.matchId` from the pair. `shortlist`, `profile_view` and `wallet` get the organization
      ids. Ledger: an opening `adjustment` row per wallet.
    - Photos: copy the public `avatars/{userId}/profile.*` into `biodata-photos` as the private
      position 0 with visibility `after_yes`, generate veils, then empty the public bucket.
3. **Code switch-over**: the new routes and procedures, legacy redirects, and the removed procedures
   (`profileStats`, `browse`, `ai.streamMessage`).
4. **Tighten**: NOT NULL on the new foreign keys; drop `bidAmount`, `isActive` and `profilePhoto`
   after one release.

---

## 16. Out of scope (MVP)

- Horoscope matching (guna milan, kundli) computation. The fields are stored and shown only.
- A paid matchmaker or helper seat that manages many families (future plan).
- In-app voice or video calls. Calls happen off-platform once booked.
- Phone or ID verification and selfie verification. The enum values exist; the flows don't.
- Native apps and push notifications (the web app only, with email).
- Translating the whole app UI. The app ships in English. Only the `family` namespace and translated
  pages cover hi, ur, pa, gu, bn, ta and te. Arabic and Kannada, Malayalam, Marathi and Odia pages
  come later (Tiro Devanagari already covers Marathi text).
- The template's de, es and fr bundles are removed from the saas locale switcher.
- AI photo moderation beyond size and type checks. Success-story pages on marketing.
- Suggest-a-page by family (a family member proposing a page not in the folio). They keep and pencil
  instead.
- Background checks. The disclosure says they are not done.

## 17. Assumptions and open questions

- Assumptions:
    - the 19:00 folio release
    - the 10 notes a day on Premium (it was unlimited in the old limit check)
    - the 40-folios-per-day exposure cap
    - the values-budget tie-breakers
    - the $5-for-5-credits pack
    - the 30-day auto-close of unanswered letters
    - 2 credits a month included on Premium
    - Validate each with the first cohort.
- `timeZone` for migrated users cannot always be inferred from free-text `location`. The migration
  prompts once.
- The legal copy (special-category consent, state dating-safety notices, IMBRA neutrality) needs
  review by counsel before launch.
- Whether a guardian may pay without the candidate being able to see the payer. Currently billing is
  visible to owner and guardians.

---

## 18. Foundation build notes (stage 2, 2026-09-26)

What the data model, API, AI, seed and payments stage built, and where it refines the contract
above. Everything else follows §5-§14 as written.

- **Schema** (`packages/database/drizzle/schema/postgres.ts`, enum values in `drizzle/domain.ts`):
    - `biodata_profile.gender`, `dateOfBirth` and `religion` are nullable in the database, because
      `households.create` makes the draft page before they are known. `profiles.publish` enforces the
      required four.
    - The §6.1 `Verification` enum is named `VerificationLevel` in Postgres, so it never reads like
      Better Auth's `verification` table.
    - `household_setting.memberLabels` (jsonb, userId → "Ammi") stores the relation labels F11 needs.
    - `SafetyFlag` carries `categories[]` as well as the primary `category` (Karan's note is money and
      off-platform).
    - A letter's status `closed` means auto-closed after 30 days or closed by a block. When an
      introduction closes, the letter stays `accepted` and the `match` carries the closure.
- **API additions**: `households.listMine` (the "Searching for" switcher), `households.getClaim`
  (the invited candidate reads the draft before they are a member), `households.setMemberLabel`,
  `households.closePreview`, `households.closeSearch` (F13), `households.setClosingStory` and
  `households.delete`. `shortlists.toggle`/`list` and `interests.matches` are the compatibility
  aliases. `profiles.getPage` returns `LetterRef` (`letterId`, `state`, `isPriority`, `createdAt`)
  for `myLetter`/`theirLetter`, plus `familyLinksAllowed`. `folio.today` also returns `viewer` (role,
  candidate or not), `firstRelease`, `locked: 'paused' | 'closed'`, and per page `kept`, `myLetter`
  and `page: null` when a page closed mid-read.
- **Rules made precise**: only the recipient's dealbreakers can refuse a note (`NOT_A_FIT`); the
  writer's own are their choice. Premium's 2 monthly credits start with the paid period, not the
  7-day trial. A subscription that is `active` or `trialing` is Premium, whatever its price id.
  Guardians can invite family at the member role only (Better Auth `beforeCreateInvitation`).
- **Error codes** are listed in `packages/api/lib/errors.ts` (`error.data.code`). Server-side copy
  (notification lines, default notes, first-line templates, share text) is in the `rishta`
  namespace of `packages/i18n/translations/en/mail.json`.
- **Not yet built** (UI or later stages): the Better Auth access-control roles that make role
  changes and removals owner-only; the dedicated email templates in §10 (the generic notification
  template is used, always discreet); server-made veils (the client uploads the 32px veil via
  `variant: 'veil'`); the PDF, image and cron route handlers; attaching the `.ics` to the
  `CALL_BOOKED` email (the Introduction links to `/api/calls/:proposalId/ics` instead); the
  additive migration and §15 backfill script.
