# Rishta — Manual Testing Checklist

## Prerequisites
- App deployed at `https://rishta-saas.vercel.app`
- Supabase database with schema pushed
- 8 sample profiles seeded in the database

---

## 1. Auth Flow

### Signup
- [ ] Go to `/signup`
- [ ] Create account with email + password
- [ ] Check rose glow behind auth card (dark mode)
- [ ] Check Outfit display font on "Create an account" heading
- [ ] Heart logo visible in top-left

### Email Verification
- [ ] After signup, you'll see "verify your email" (email won't arrive without Resend)
- [ ] Ask admin to verify email in database, or login directly

### Login
- [ ] Go to `/login`
- [ ] Log in with verified account
- [ ] Verify redirect to dashboard (`/`)
- [ ] Heart favicon visible in browser tab

---

## 2. Homepage / Discover (`/`)

### Profile Cards (This IS the homepage)
- [ ] Page title: "Discover" with subtitle showing profile count + "Rishta Aaya Hai ✨"
- [ ] 8 sample profiles in 2-column grid
- [ ] Gradient card headers (unique color per person)
- [ ] Avatar initials floating over gradient
- [ ] Bookmark button on gradient
- [ ] Verified badge on verified profiles
- [ ] Name, age, religion, community, location, profession, education, height
- [ ] About me preview in italic
- [ ] Diet + language tags
- [ ] "Send Interest" + "View Biodata" buttons
- [ ] 🔒 Privacy note on every card
- [ ] Skeleton loading state while fetching

### Sidebar
- [ ] **Collapsed by default** (icons only — maximizes card viewing area)
- [ ] Click expand button to see labels
- [ ] Nav order: Discover → Interests → Matches → Shortlist → My Biodata → Activity → Preferences
- [ ] Heart logo (not rocket) in top-left
- [ ] No organization selector (orgs disabled)
- [ ] No template items (Cases, Price List, Chatbot)

## 2b. Activity (`/activity`)

### Overview
- [ ] Profile completeness card with progress bar + contextual messages
- [ ] 4 stat cards: Pending Interests, Interests Sent, Matches, Privacy
- [ ] "Your rishta is waiting" CTA if no profile exists

---

## 3. Profile Creation (`/profile/edit`)

### Form Sections
- [ ] **Basic Info**: Display Name*, Gender*, Date of Birth*, Height, Religion*, Community, Mother Tongue, Marital Status, Location, Created By
- [ ] **Education & Career**: Education, University, Profession, Employer, Income Range
- [ ] **Family**: Family Type, Siblings, Father's Occupation, Mother's Occupation
- [ ] **Lifestyle**: Diet, Smoking, Drinking (all dropdowns)
- [ ] **About**: About Me (textarea), Looking For (textarea)

### Validation
- [ ] Cannot submit without Display Name, Date of Birth, Religion (required fields)
- [ ] Form shows existing data when editing
- [ ] After save → redirects to `/profile`

### Test Data
Create a profile with:
- Name: "Test User"
- Gender: Male
- DOB: 1996-06-15
- Height: 175
- Religion: Hindu
- Community: Punjabi
- Education: Masters
- Profession: Engineer
- Location: Dallas, TX

---

## 4. My Profile (`/profile`)

- [ ] Header card with initial avatar, name, age, gender, religion, location
- [ ] "Created by [parent/self]" badge if applicable
- [ ] "Verified" badge (green) if profile is verified
- [ ] About Me and Looking For sections (if filled)
- [ ] Basic Info section: Age, Height, Religion, Community, Mother Tongue, Marital Status, Diet
- [ ] Education & Career section: Education, University, Profession, Employer, Income
- [ ] Family section: Family Type, Father's Occupation, Mother's Occupation, Siblings
- [ ] "Edit" button navigates to `/profile/edit`
- [ ] Empty state if no profile: "No profile yet" with "Create Biodata" button

---

## 5. Browse / Discover (`/browse`)

### Profile Cards
- [ ] 8 sample profiles visible in 2-column grid
- [ ] Each card has a **unique gradient header** (rose, violet, amber, emerald, etc.)
- [ ] Large **initial avatar** floating over the gradient
- [ ] **Bookmark button** (🔖) overlaid on gradient header
- [ ] **Verified badge** on verified profiles
- [ ] Name, age, religion, community visible
- [ ] **2-column detail grid**: location, profession, education, height (with icons)
- [ ] **About me preview** in italic (2-line clamp)
- [ ] **Tags**: diet, language, marital status
- [ ] **"Send Interest"** button on each card
- [ ] **"View Biodata"** button on each card
- [ ] **🔒 "Contact revealed on mutual match"** note on every card

### Interactions
- [ ] Click "Send Interest" → success (or "already sent")
- [ ] Click bookmark → shortlists the profile
- [ ] Click card body or "View Biodata" → navigates to `/browse/[userId]`

### Empty State
- [ ] If somehow no profiles: sparkle icon + "No profiles yet"

---

## 6. Profile Detail (`/browse/[userId]`)

- [ ] "Back to browse" link at top
- [ ] Gradient header with name, age, gender, religion, location
- [ ] Community badge + "Created by family" badge if applicable
- [ ] **Send Interest** + **Shortlist** buttons
- [ ] "✅ Interest sent!" confirmation after sending
- [ ] About section: About Me + Looking For
- [ ] Basic Info card: Height, Marital Status, Mother Tongue, Diet, Smoking, Drinking
- [ ] Education & Career card: Education, University, Profession, Employer, Income
- [ ] Family card: Family Type, Siblings, Father's & Mother's Occupation

---

## 7. Interests (`/interests`)

### Tabs
- [ ] Two tabs: **Received** and **Sent**
- [ ] Default tab is "Received"

### Received Interests
- [ ] Shows profiles that sent you an interest
- [ ] Each row: avatar initial, name, age, religion, location
- [ ] Status badge: "pending" (amber), "accepted" (green), "declined" (red)
- [ ] **Accept** (✓) and **Decline** (✗) buttons on pending interests
- [ ] Accept → status changes to "accepted"
- [ ] Decline → status changes to "declined"

### Sent Interests
- [ ] Shows profiles you sent interest to
- [ ] Status badges visible (no action buttons — you wait)

### Empty State
- [ ] "No received interests yet — When someone shows interest, it'll appear here"
- [ ] "No sent interests yet — Browse profiles and send interests"

---

## 8. Matches (`/matches`)

### When Matched
- [ ] A match occurs when BOTH users accept each other's interest
- [ ] Match card shows gradient header (violet → pink)
- [ ] Name, age, religion, location visible
- [ ] **"Matched" badge** with sparkle icon
- [ ] **Contact Details revealed**: email address shown
- [ ] Contact name shown

### Empty State
- [ ] "No matches yet — When you and someone both accept each other's interest, you'll see them here with their contact info"

### Test Flow for Matching
1. Log in as User A → send interest to User B
2. Log in as User B → go to Interests → accept User A's interest
3. Log in as User B → send interest to User A
4. Log in as User A → go to Interests → accept User B's interest
5. Both users should now see each other in `/matches` with contact details

---

## 9. Shortlist (`/shortlist`)

- [ ] Shows grid of bookmarked profiles
- [ ] Each card: avatar initial, name, age, religion, location
- [ ] Click card → navigates to profile detail
- [ ] Empty state: "No saved profiles — Bookmark profiles while browsing to save them here"

---

## 10. Preferences (`/preferences`)

### Form
- [ ] **Age & Height**: Min/Max age, Min/Max height (cm)
- [ ] **Background**: Religions, Communities, Education Levels, Professions (comma-separated text)
- [ ] **Lifestyle & Location**: Locations, Diet, Marital Status
- [ ] Save button → "✅ Saved!" confirmation

### Persistence
- [ ] After saving, refresh page → values persist
- [ ] Edit values → save again → updates correctly

---

## 11. UI/UX Checks

### Theme
- [ ] Dark mode is default
- [ ] Rose/burgundy accent throughout (buttons, links, gradients)
- [ ] Toggle to light mode → verify rose theme works

### Typography
- [ ] Page headings: Outfit display font
- [ ] Body text: Inter
- [ ] Auth form headings: display font
- [ ] Stats/numbers: display font

### Icons & Branding
- [ ] Heart logo in sidebar (not rocket)
- [ ] Rose heart favicon in browser tab
- [ ] Sidebar nav items have relevant icons (Search, Heart, Sparkles, Bookmark, etc.)
- [ ] No template items (Cases, Price List, Chatbot)

### Browse Page Design
- [ ] Gradient card headers (not flat/boring)
- [ ] Avatars with border ring floating over gradient
- [ ] Privacy lock note on every card
- [ ] Inline action buttons (Send Interest + View Biodata)

### Loading States
- [ ] Dashboard shows skeleton cards while loading
- [ ] Browse shows skeleton cards while loading
- [ ] Profile shows skeleton while loading
- [ ] No "$0" or "0%" flash before data loads

### Responsive
- [ ] Dashboard stacks on mobile
- [ ] Browse cards go single-column on mobile
- [ ] Profile edit form is usable on mobile
- [ ] Sidebar collapses to hamburger on mobile

---

## 12. Edge Cases

- [ ] Try sending interest to same person twice (should not duplicate)
- [ ] Try shortlisting same person twice (should toggle off)
- [ ] Access `/browse/nonexistent-id` → "Profile not found"
- [ ] Access pages without logging in → redirect to `/login`
- [ ] Create profile → edit it → verify changes persist

---

## Quick Test Flow (5 minutes)

1. Sign up → complete onboarding (name/avatar)
2. Homepage = **Discover** page → see 8 gradient profile cards immediately
3. Sidebar is **collapsed** (icons only) — click expand to see labels
4. Send interest to 2 profiles directly from the homepage
5. Shortlist 1 profile via bookmark button on gradient
6. Create biodata (`/profile/edit`) → fill basic fields → save
7. Go to Activity (`/activity`) → see completeness progress bar + stats
8. Check Interests → Sent tab → see 2 pending
9. Check Shortlist → see 1 saved profile
10. ✅ Done — discovery-first flow works end to end

---

## Sample Profiles in Database

| Name | Gender | Religion | Community | Profession | Location |
|------|--------|----------|-----------|------------|----------|
| Priya Sharma | Female | Hindu | Punjabi | Software Engineer @ Google | San Francisco, CA |
| Rahul Patel | Male | Hindu | Gujarati | Product Manager @ Microsoft | Seattle, WA |
| Aisha Khan | Female | Muslim | Hyderabadi | UX Designer @ Meta | Austin, TX |
| Arjun Reddy | Male | Hindu | Tamil | Data Scientist @ Amazon | New York, NY |
| Simran Kaur | Female | Sikh | Punjabi | Doctor @ Johns Hopkins | Toronto, ON |
| Vikram Mehta | Male | Jain | Gujarati | Investment Banker @ Goldman Sachs | Chicago, IL |
| Nadia Ahmed | Female | Muslim | Bengali | Marketing Manager @ Spotify | Brooklyn, NY |
| Rohan Gupta | Male | Hindu | Bengali | Engineer @ Tesla | Palo Alto, CA |
