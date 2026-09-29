# VISION.md: Rishta

> Positioning, customer, market and pricing rationale. The product is specified in **spec.md** and
> the design in **design.md**. Anything that is inference rather than an observed fact is marked
> _(assumption)_. There are deliberately no market-size or conversion statistics here: none have
> been measured yet.
> Last updated: 2026-09-26.

---

## One line

A private, respectful place to find someone to marry, built around the biodata families already
trust. You read a few complete pages each evening, write a real note to someone you'd like to meet,
and both seals break when you both say yes.

## Positioning

- **For** second-generation South Asian professionals in the US, UK and Canada who want marriage,
  not dating, and for the parents and siblings helping them,
- **Rishta is** a matchmaking service built on the biodata page,
- **that** delivers a small, serious daily folio matched to your non-negotiables, turns interest
  into a written, sealed note, and brings family in through a link rather than an app,
- **unlike** dating apps (built for swiping and volume) and legacy matrimony sites (built for
  contact-reveal credits and endless search filters),
- **because** it keeps what families already do (the biodata, the forwarded page, the phone call
  between families) and removes what they hate: casual swipes, popularity games, exposed photos,
  ghosting.

The tagline stays warm rather than salesy: _"Rishta aaya hai."_ ("A proposal has arrived.")

## Name and brand decision

The repo, the marketing site and the first version (Apr 25, 2026: "Rishta: modern matrimonial
platform for the South Asian diaspora") used **Rishta**. Later the saas app, the logo (two
interlocking rings) and spec.md were rebranded to **Vow**, with "Vow Aaya Hai" and a
"universal, any culture" pitch.

**Decision: the product is Rishta.** The reasons:

1. "Vow Aaya Hai" only works for people who already know "Rishta aaya hai". The Hindi-Urdu phrase
   is the joke, so the product should say the word plainly.
2. The defensible wedge is marriage-intent matching with real family involvement, which is
   strongest where the biodata is an existing artifact: South Asian families.
3. The universal ambition is kept as an **expansion path**, not the launch position. The biodata
   has real equivalents elsewhere: the Orthodox Jewish shidduch résumé, the Muslim marriage CV, and
   family introductions in Nigerian, Ethiopian and Arab communities. The paradigm travels without
   turning into a dating app. That is why the seed data stays multicultural and nothing in the
   product is exclusive.
4. Rings, rose colours and hearts are every wedding and dating app. They go.

## Target customer

**The candidate** (the most common buyer)

- 26-36, a second-generation professional (engineer, doctor, pharmacist, consultant, accountant)
  with their own card, in the US, UK or Canada.
- Also divorced or widowed people in their 30s and 40s trying again, who are poorly served by apps
  that assume a first marriage.
- Often on 2-3 apps at once, "tired of these apps", under quiet or loud family pressure.
- Searches actively for months, typically 2-6 of them _(assumption)_, and ideally leaves engaged.

**The parent** (often the payer)

- Most often the mother, 52-68. She pays for seriousness, verification and privacy the way she
  would pay a community matchmaker, not for swipes.
- Lives in WhatsApp. Will open a link; will not learn an app.
- Reads the family section before the photo.

**The helper**

- A sibling, cousin, aunt, or an informal community matchmaker ("rishta aunty"), imam, or gurdwara
  or temple volunteer.
- A future paid seat for matchmakers who handle many families is a natural extension (out of MVP
  scope).

## The problem

1. **Wrong tool for the job.** Dating apps are built for volume and casual intent. Swipe-to-decide,
   likes, streaks and "It's a match!" make a marriage proposal feel like a game. Families find them
   not respectable, and candidates find them a waste of evenings.
2. **Legacy matrimony sites feel like classifieds.** Long filter forms, contact-reveal credits and
   pages built for parents from 2005. Photo-first cards and popularity mechanics commodify people,
   women especially.
3. **The real process lives in WhatsApp**, and it is chaos. Biodata PDFs and JPEGs get forwarded
   through family groups with no privacy, no consent, no record of who saw what, and no way to say
   no kindly.
4. **Mismatches waste everyone's time.** Timeline, relocation, faith and diet are known in advance,
   yet people discover them three conversations in.
5. **After a yes, nothing structures the next step.** Apps hand over a chat, and the conversation
   stalls, or someone ghosts. The real sequence (a call, a meeting, then families meeting) is
   unsupported, and it often spans two or three time zones.
6. **Safety.** Romance scams (money requests, a fast move to WhatsApp, "stuck abroad"),
   visa-motivated profiles, and photos that leak outside the platform. For women from conservative
   families, a leak can do real harm.

## Why now _(assumptions, stated as such)_

- A large cohort of second-generation diaspora children is at marriage age now. Many are
  explicitly fatigued by dating apps and still want family involvement on their own terms.
- Families already circulate biodatas digitally (PDF and image forwards). The behaviour exists; it
  only lacks a private, respectful home.
- Machine translation has become good and cheap enough to show one page to a parent in Hindi, Urdu,
  Punjabi, Gujarati, Bengali, Tamil or Telugu. That makes the parent a participant without an
  account, which was previously impractical.
- Privacy expectations and regulation are rising: GDPR and UK GDPR special-category data, CPRA
  sensitive data, US state dating-safety rules, and the UK Online Safety Act. A product built
  privacy-first from the start has an advantage over incumbents retrofitting it.

## Competitors and alternatives

| Alternative                                                                   | What they do well                                                                                   | Where they fall short for our customer                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shaadi.com, Jeevansathi, BharatMatrimony**                                  | Huge reach in India. Parents know them. The biodata-style fields. "Express interest" and "connect". | Built for search volume and contact-reveal credits. The design feels dated to diaspora candidates. Popularity and placement mechanics. Photo-first. (Shaadi.com removed a skin-tone filter in 2020 after public criticism, which shows how easily these products drift into discrimination.) |
| **Muzz**                                                                      | Marriage intent for Muslims. Photo blur. A chaperone (wali) option.                                 | Faith-specific. A swipe-style interface. Family involvement is limited to copying a chaperone.                                                                                                                                                                                               |
| **Dil Mil**                                                                   | South Asian diaspora focus, modern design.                                                          | A dating-app model: cards, swipes, likes.                                                                                                                                                                                                                                                    |
| **Hinge** (and other dating apps)                                             | Excellent product craft. Prompts. "Designed to be deleted".                                         | Dating, not marriage. No family, no biodata, no non-negotiables. Volume incentives.                                                                                                                                                                                                          |
| **WhatsApp rishta groups, relatives, "aunties"**                              | Trust, social capital, real introductions, free.                                                    | No privacy or consent, no structure, awkward to decline, limited reach, invisible to the candidate.                                                                                                                                                                                          |
| **Marriage bureaus at mosques, gurdwaras and temples; community matchmakers** | High trust and personal vetting.                                                                    | Small pools, slow, paper-based, dependent on one person.                                                                                                                                                                                                                                     |

## Differentiation

1. **The biodata is the interface.** Complete pages read top to bottom, in the traditional order,
   not photo cards judged in two seconds. Your own page is edited in place and exports print-true.
2. **A proposal costs a sentence.** A 40-400 character note pressed with your seal. There are no
   likes and no swipes: swipes only turn pages. This filters out low-intent outreach, which is the
   recipient's biggest burden.
3. **Both seals break at once.** Photos, full name, workplace and contact stay sealed until both say
   yes, then open to each other together. No contact is exposed before consent.
4. **Family without takeover.** Parents react through a private, watermarked, translated WhatsApp
   link (Proceed · Let's talk · Not for us) with no account. Households give siblings and parents a
   seat. **Only the adult candidate can seal or accept**, and a page a parent drafts must be claimed
   by the candidate before anyone sees it.
5. **Reasons, not scores.** "Why this page" lists plain reasons with honest gaps ("Diet differs",
   "Not stated on his page"). There are no percentages, bids or popularity numbers.
6. **A structured yes.** The Introduction proposes three evenings across both time zones and leads
   on to families meeting. Closing is kind ("He wished you well"), never ghosting.
7. **Designed to end.** "We're engaged" closes the page kindly, lets open conversations know, and
   invites a referral.

## Business model and pricing rationale

Facts carried over from the existing build: Premium at **$29/month** (and $290/year) with a **7-day
trial**; **3 interests a day free**; **10 free credits** when a household is created; a **$5**
price point, previously a "24-hour boost" that never launched.

| Offer               | Price                               | What it buys                                                                                                                                    | Rationale                                                                                                                                                                                                                                                                 |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Free                | $0                                  | A folio of 5 pages each evening, 3 sealed notes a day, family links, all safety features                                                        | The daily folio and the family link are the growth engine. Free must be genuinely useful.                                                                                                                                                                                 |
| Premium (household) | $29/month or $290/year, 7-day trial | 7 pages each evening, 10 notes a day, 2 credits a month, up to 6 household members, unlimited family links                                      | Priced like a serious service, not an app subscription. It's the kind of spend a parent makes the way they would pay a matchmaker, and it's attached to the **household**, so a parent can pay _(assumption: parents are frequent payers, as on legacy matrimony sites)_. |
| Credits             | $5 for 5                            | One credit = one extra note on a busy day, or one **priority note** (labelled for the recipient, pinned at the top of her letters for 48 hours) | Keeps paid priority from the owner's credit experiments, but **disclosed and flat**. No bids, no auctions, no ranks. People are never inventory.                                                                                                                          |

**Deliberately not sold:**

- Visibility boosts
- "See who likes you"
- Contact reveals (contact opens only by mutual yes)
- Safety features: incognito reading, photo veils, reports and screening are always free

The invented "5x more views, 3x more matches" claims are gone and must not return.

**Churn on success is the model.** A happy customer leaves engaged. Revenue depends on:

- The product being trusted enough that families pay during an active search, typically months
  _(assumption)_.
- Every engagement bringing in the next family: a cousin, a friend.

**Compliance**: the same prices and services regardless of gender or nationality (staying inside
IMBRA's exemption for general matchmaking services); clear auto-renewal terms and online
cancellation through the Stripe customer portal (ROSCA, California rules).

## Growth loop

1. A candidate shows a page to her mother through a family link, and the mother opens it on
   WhatsApp in Hindi. The link is the invitation: the mother sees a respectable product without
   installing anything.
2. A candidate exports their own page as a PDF or WhatsApp image with a quiet "Made on Rishta"
   footer, and the family forwards it the way biodatas are forwarded today.
3. "We're engaged" closes a page and asks, gently, "Know someone who's searching?"
4. Acquisition is word of mouth among cousins, aunties and community groups _(assumption)_.
   Marketing is a founders' letter, not ads that look like dating apps.

## Success metrics

We will set numeric targets after the first cohort. Until then these are the measures, not the
goals.

- **North star: introductions that reach a booked first call**, per active candidate per month. It
  captures fit (a yes happened) and follow-through (a call was booked).
- **Recipient experience** (women receive far more letters than they send):
    - the share of letters answered (yes or kind decline) within 72 hours
    - the share of letters closed by auto-close, where lower is better
    - reports per 1,000 letters, and the share of safety-flagged notes that led to a block
- **Folio quality**: the share of folio pages answered with Keep or Write a note; Pass reasons by
  category (a signal that non-negotiables are wrong).
- **Family**: family links opened per active household, and the share with a reaction.
- **Outcome**: closed searches with the reason "engaged", in total and "through Rishta".
- **Business**: Free to Premium conversion by household, who paid (candidate or guardian), and
  referrals from closed searches.
- **Guardrails** (must not rise): time from signup to the first harassment report, photo-access
  errors, and letters sent to pages whose dealbreakers exclude the sender (should be zero by
  construction).

## Principles we will not trade for growth

- No popularity, bids, ranks, "N people interested" or compatibility percentages.
- No swipe-to-decide, confetti, sounds or dark patterns ("you're running out").
- The adult candidate's consent is required and final. Family advises; it never acts.
- Safety features are never paywalled.
- AI drafts, translates and flags, visibly. It never decides, never sends and never rates anyone.

## Risks

- **Cold start in a two-sided, segmented market.** Faith, community and location segment the pool.
  Mitigations: launch in a few diaspora metros _(assumption: NJ/NY, Toronto/GTA, the Bay Area,
  Dallas-Houston, Chicago, London)_; a small daily folio makes a thin pool feel intentional rather
  than empty; family links recruit families.
- **Recipient overload** (women flooded with notes). Mitigations: mutual dealbreakers, the note
  minimum, daily limits, the exposure cap per page, and priority notes labelled and capped.
- **Trust and safety.** Scams, fake or visa-motivated profiles, harassment, and profiles made
  without consent. Mitigations: the claim step, 18+, veils, sealed contact, screening, reports read
  by people.
- **Regulatory.** Special-category data consent, state dating-safety disclosures, the Online Safety
  Act and the DSA. The legal copy needs counsel before launch.
- **Brand drift toward a dating app**, where the easiest growth hacks live. design.md §17 and the
  rules in claude.md exist to prevent it.

## Beyond the MVP

- A matchmaker or helper seat (paid) managing several families' pages, with credit for introductions.
- Phone and ID verification; selfie verification.
- Optional horoscope compatibility (kundli) for families who want it, shown as information, never
  as a score.
- Full app UI in Hindi and Urdu, then more scripts; Arabic.
- Native apps with discreet push notifications.
- Expansion communities: the shidduch résumé, the Muslim marriage CV, and African and Arab family
  introductions.
