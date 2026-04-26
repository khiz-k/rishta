# Vow — Manual Testing Checklist

## Prerequisites
- App deployed at `https://rishta-saas.vercel.app`
- Supabase database with schema pushed
- Supabase Storage `avatars` bucket with SELECT + INSERT + UPDATE policies
- 12 diverse sample profiles seeded with DiceBear avatars
- Email verification disabled (auto-verified on signup)

---

## 1. Auth Flow

### Signup
- [ ] Go to `/signup`
- [ ] Create account with any email + password (no verification needed)
- [ ] Auto-redirected to onboarding (name/avatar)
- [ ] Interlocking rings logo, "Vow" text

### Login
- [ ] Go to `/login`, log in with verified account
- [ ] Redirected to `/quiz` (if quiz not completed)

---

## 2. Onboarding Quiz (`/quiz`)

### Step 1: The Non-Negotiables
- [ ] 4 timeline options with animated option buttons
- [ ] Cannot advance without selecting

### Step 2: Location & Residency
- [ ] Relocate? Yes/No buttons
- [ ] Citizenship? Yes/No buttons
- [ ] Preferred locations input

### Step 3: Background & Family
- [ ] Min/Max age, Community/Ethnicity, Education level

### Step 4: Dealbreakers
- [ ] Religion + Diet inputs

### Step 5: Values (Point Allocation)
- [ ] 12-point budget across Physical attraction / Personality / Financial
- [ ] Can't exceed 12 — sliders cap
- [ ] Green badge when 0 points left

### Flow
- [ ] Animated transitions between steps
- [ ] "Build my profile" → saves preferences → redirects to `/profile/edit`

---

## 3. Profile Creation (`/profile/edit`)

### ⚠️ Photo Upload (Supabase Storage)
- [ ] Camera icon circle at top of form
- [ ] Click → file picker opens (accepts jpeg/png/webp)
- [ ] Photo uploads to Supabase `avatars` bucket
- [ ] Preview shows uploaded photo in circle
- [ ] Hover overlay with camera icon
- [ ] "Uploading..." indicator during upload
- [ ] Error message shown if upload fails (red text below circle)
- [ ] **Requires:** Supabase Storage RLS policies (SELECT, INSERT, UPDATE on avatars bucket)
- [ ] **Requires:** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT key) env vars

### Form
- [ ] Required fields: Name, Gender, DOB, Religion (validation errors shown)
- [ ] All optional fields: height, community, education, profession, etc.
- [ ] Form centered with `max-w-2xl mx-auto`
- [ ] "Create Profile" → saves → redirects to `/` (discover)

### Gating
- [ ] Cannot access any page without quiz + profile
- [ ] Spinner shown while checking (no flash of content)

---

## 4. Discover (`/`) — Single Card Swipe

### Card Layout
- [ ] Progress dots (clickable, Instagram-style)
- [ ] Counter: "Discover · 1/12"
- [ ] Arrow buttons + keyboard shortcuts (← →)
- [ ] Gradient banner (unique color per person)
- [ ] **Photo in avatar circle** (falls back to initial letter)
- [ ] Verified + "Created by" + **Compatibility %** badges on banner
- [ ] Name, age, religion, community, location, height
- [ ] About me in quote card, Looking for, Career/Family details, Tags

### Actions
- [ ] ✗ Pass — spring button, whoosh sound, advances
- [ ] ⭐ Shortlist — spring button, pop sound
- [ ] ❤️ Interest — spring button, ding sound, confetti, auto-advance
- [ ] Swipe left/right with tilt + ghost overlays
- [ ] Haptic feedback on mobile

### ⚡ Credit Bidding
- [ ] "⚡ Boost with credits to stand out" link below buttons
- [ ] Amber slider expands (0-50 range, shows wallet balance)
- [ ] Heart button turns **amber** when credits attached
- [ ] Feedback: "Interest sent with X credits"
- [ ] Credits deducted from wallet server-side

### Limits
- [ ] 3 interests/day for free users
- [ ] Error message when limit hit: "Upgrade to Vow Premium"
- [ ] Blocked users excluded from results

---

## 5. Interests (`/interests`)

- [ ] **Received tab**: sorted by bid amount (highest first)
- [ ] 🔥 flame badge shows credit amount on boosted interests
- [ ] Accept (✓) / Decline (✗) buttons on pending
- [ ] **Sent tab**: profiles with status badges

---

## 6. Matches (`/matches`)

- [ ] Match cards with gradient header, email revealed
- [ ] **"Chat" button** → `/matches/[userId]`

---

## 7. Messages (`/messages`)

- [ ] Conversation list with profile photos + names
- [ ] Click → chat page

---

## 8. Chat (`/matches/[userId]`)

- [ ] iMessage-style bubbles
- [ ] **Read receipts**: ✓ sent / ✓✓ read
- [ ] Auto mark-as-read on open
- [ ] 3-second polling
- [ ] Enter to send, auto-scroll

---

## 9. Profile Detail (`/browse/[userId]`)

- [ ] **Photo** in avatar circle
- [ ] Full biodata display
- [ ] Send Interest + Shortlist + **Block** (shield icon) buttons
- [ ] **trackView fires** (populates Who Viewed Me)
- [ ] Back link → `/` (discover)

---

## 10. Who Viewed Me (`/viewers`)

- [ ] List of people who viewed your profile
- [ ] Photo, name, age, location, date

---

## 11. My Profile / Edit / Shortlist / Activity / Preferences

- [ ] All functional with seed data
- [ ] Activity shows stats for interests, matches

---

## 12. Premium (`/premium`)

- [ ] Free vs Premium ($29/mo) comparison cards
- [ ] Profile Boost ($5/24hr) teaser
- [ ] "Why go Premium" stats
- [ ] "Coming Soon" buttons

---

## 13. Sidebar Nav

- [ ] Collapsed by default (icons only)
- [ ] Order: Discover → Interests → Matches → Messages → Shortlist → My Biodata → Viewers → Activity → Preferences → Premium → Settings
- [ ] All unique icons (no duplicates)
- [ ] Mobile: hamburger menu

---

## Quick Test Flow

1. Sign up (no verification needed) → onboarding
2. Quiz: 5 steps → "Build my profile"
3. **Upload photo** (click camera circle) → fill name/gender/DOB/religion → save
4. Discover: swipe profiles, see compatibility %, try bidding with credits
5. Send 3 interests → hit daily limit
6. Check Interests page (received sorted by bid)
7. Check Matches → Chat with Sofia
8. Check Shortlist, Viewers, Activity
9. Check Premium page
10. ✅ Done

---

## Seed Data (12 Profiles)

| Name | Community | Religion | Location | Created By |
|---|---|---|---|---|
| Maria Santos | Brazilian | Christian | Miami, FL | self |
| Omar Hassan | Egyptian | Muslim | Baltimore, MD | self |
| Yuki Tanaka | Japanese | Buddhist | San Francisco, CA | self |
| David Cohen | Israeli-American | Other | New York, NY | self |
| Fatima Ali | Somali | Muslim | Toronto, ON | parent |
| Andrei Volkov | Russian | Christian | London, UK | self |
| Priya Sharma | Punjabi | Hindu | San Francisco, CA | self |
| Jin Park | Korean | Christian | Seoul / LA | self |
| Amara Okafor | Nigerian | Christian | Austin, TX | self |
| Rahul Patel | Gujarati | Hindu | Seattle, WA | self |
| Sofia Martinez | Mexican-American | Christian | Chicago, IL | self |
| Ali Khan | Pakistani | Muslim | Dallas, TX | parent |

**Seed interactions:** 3 matches (Sofia, Maria, Omar) with messages, 2 pending received interests, shortlists, all with DiceBear avatars.
