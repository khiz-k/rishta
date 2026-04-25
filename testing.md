# Vow — Manual Testing Checklist

## Prerequisites
- App deployed at `https://rishta-saas.vercel.app`
- Supabase database with schema pushed
- Supabase Storage `avatars` bucket with SELECT + INSERT policies
- 8 sample profiles seeded

---

## 1. Auth Flow

### Signup
- [ ] Go to `/signup`
- [ ] Create account with email + password
- [ ] Rose glow behind auth card (dark mode)
- [ ] Outfit display font on heading
- [ ] Interlocking rings logo in top-left
- [ ] "Vow" text next to logo

### Login
- [ ] Go to `/login`
- [ ] Log in with verified account
- [ ] Redirected to `/quiz` (if quiz not completed)
- [ ] Ring favicon in browser tab

---

## 2. Onboarding Quiz (`/quiz`)

### Step 1: The Non-Negotiables
- [ ] "When are you looking to get married?" — 4 options (3mo/6mo/1yr/2yr+)
- [ ] Animated option buttons with spring tap
- [ ] Cannot advance without selecting timeline
- [ ] Progress bar shows 1/5

### Step 2: Location & Residency
- [ ] "Willing to relocate?" — Yes/No option buttons
- [ ] "Require citizenship/PR?" — Yes/No option buttons
- [ ] Preferred locations text input
- [ ] Cannot advance without both yes/no answered

### Step 3: Background & Family
- [ ] Min/Max age inputs
- [ ] Community/Ethnicity text input
- [ ] Education level preferred input

### Step 4: Dealbreakers
- [ ] Religion input (comma-separated)
- [ ] Diet preference input

### Step 5: Values
- [ ] Looks slider (1-10) with live value display
- [ ] Personality slider (1-10)
- [ ] Financial stability slider (1-10)
- [ ] "Not important" / "Essential" labels

### Flow
- [ ] Animated step transitions (slide left/right)
- [ ] Back button on steps 2-5
- [ ] "Build my profile" button on step 5 → saves preferences + redirects to `/profile/edit`
- [ ] Quiz data persists in `partner_preference` table

---

## 3. Profile Creation (`/profile/edit`)

### Photo Upload
- [ ] Camera icon circle at top of form
- [ ] Click to open file picker
- [ ] Upload to Supabase Storage `avatars` bucket
- [ ] Preview shows uploaded photo
- [ ] Hover overlay with camera icon
- [ ] "Uploading..." indicator

### Form
- [ ] Basic Info: Name*, Gender*, DOB*, Height, Religion*, Community, Mother Tongue, Marital Status, Location, Created By
- [ ] Education & Career: Education, University, Profession, Employer, Income Range
- [ ] Family: Family Type, Siblings, Father/Mother Occupation
- [ ] Lifestyle: Diet, Smoking, Drinking
- [ ] About: About Me + Looking For textareas
- [ ] "Create Profile" button → saves → redirects to `/` (discover)

### Gating
- [ ] Cannot access any page without completing quiz first
- [ ] Cannot access discover without creating profile
- [ ] Settings page always accessible

---

## 4. Discover (`/`) — Single Card View

### Card Layout
- [ ] Progress dots (Instagram-style, clickable)
- [ ] Counter: "Discover · 1/8"
- [ ] Arrow buttons (← →) + keyboard shortcuts
- [ ] Gradient banner (unique color per person)
- [ ] Avatar with photo (or initial letter fallback)
- [ ] Avatar spring-in animation
- [ ] Verified badge + "Created by" badge on banner
- [ ] **Compatibility % badge** (green ≥75%, amber ≥50%) if quiz completed
- [ ] Name, age, religion, community centered
- [ ] Location + height row
- [ ] About me in tinted quote card
- [ ] "Looking for" section
- [ ] Career + Family side-by-side details
- [ ] Diet/language/lifestyle tags
- [ ] Staggered content fade-in

### Actions
- [ ] **✗ Pass** — spring button, whoosh sound, advances
- [ ] **⭐ Shortlist** — spring button, pop sound
- [ ] **❤️ Interest** — large spring button, ding sound, confetti, auto-advance
- [ ] **Swipe left** = pass (card tilts, red ✗ overlay)
- [ ] **Swipe right** = interest (card tilts, pink ❤️ overlay)
- [ ] Haptic feedback on mobile
- [ ] Feedback overlay springs in ("Interest sent" / "Shortlisted" / "Passed")
- [ ] Ambient glow behind card

### Gender Filter
- [ ] Males see female profiles, females see male profiles (automatic)

### Preference Sorting
- [ ] Profiles sorted by match score (religion 5pts, location 4pts, age 3pts, diet 2pts)

---

## 5. Interests (`/interests`)

- [ ] Received tab: profiles with pending/accepted/declined badges
- [ ] Accept (✓) and Decline (✗) buttons on pending
- [ ] Sent tab: profiles with status badges
- [ ] Empty state per tab

---

## 6. Matches (`/matches`)

- [ ] Gradient header per match
- [ ] Name, age, religion, location
- [ ] "Matched" sparkle badge
- [ ] Contact email revealed
- [ ] **"Chat" button** → navigates to `/matches/[userId]`

---

## 7. Messages (`/messages`)

- [ ] Conversation list showing all matches
- [ ] Profile photo (or initial) + name per conversation
- [ ] "Tap to start chatting" subtitle
- [ ] Empty state: "No conversations yet"

---

## 8. Chat (`/matches/[userId]`)

- [ ] Header with avatar + name + "Matched"
- [ ] Back button → `/matches`
- [ ] iMessage-style bubbles (primary = sent, muted = received)
- [ ] **Read receipts**: ✓ (sent, faded) / ✓✓ (read, brighter) on own messages
- [ ] Timestamps on each message
- [ ] Enter to send
- [ ] Auto-scroll to bottom
- [ ] 3-second polling for new messages
- [ ] **Auto mark-as-read** when opening conversation
- [ ] Empty state: "Say hello to start the conversation"

---

## 9. My Profile (`/profile`)

- [ ] Header with photo/initial, name, age, gender, religion, location
- [ ] Verified + "Created by" badges
- [ ] About Me + Looking For
- [ ] Basic Info / Education / Family sections
- [ ] Edit button → `/profile/edit`

---

## 10. Activity (`/activity`)

- [ ] Profile completeness progress bar
- [ ] Pending interests, sent interests, matches, privacy cards
- [ ] "Your person is out there" CTA if no profile

---

## 11. Shortlist (`/shortlist`)

- [ ] Grid of bookmarked profiles
- [ ] Click → profile detail

---

## 12. Preferences (`/preferences`)

- [ ] All quiz fields editable
- [ ] Save persists

---

## 13. UI/UX Checks

### Theme & Typography
- [ ] Dark mode default, rose/burgundy accent
- [ ] DM Sans body + Outfit display headings
- [ ] Interlocking rings logo + "Vow" label

### Nav
- [ ] Collapsed by default (icons only)
- [ ] Order: Discover → Interests → Matches → Messages → Shortlist → My Biodata → Activity → Preferences
- [ ] No template items (Cases, Price List, Chatbot)

### Animations
- [ ] Card slide on profile navigate
- [ ] Spring buttons on all actions
- [ ] Confetti on interest sent
- [ ] Sound effects (whoosh/ding/pop)
- [ ] Staggered content reveal
- [ ] Auth glow behind login card

---

## Quick Test Flow (5 minutes)

1. Sign up → onboarding
2. **Quiz**: timeline → location → background → dealbreakers → values
3. **Profile**: upload photo, fill name/gender/DOB/religion → save
4. **Discover**: swipe through profiles, see compatibility badges
5. Hit ❤️ on 2 profiles, ⭐ shortlist 1, ✗ pass 1
6. Check Interests → Sent tab
7. Check Shortlist
8. Check Activity → see stats
9. ✅ Done — full flow works

---

## Sample Profiles

| Name | Gender | Religion | Community | Profession | Location |
|------|--------|----------|-----------|------------|----------|
| Priya Sharma | Female | Hindu | Punjabi | SWE @ Google | San Francisco |
| Rahul Patel | Male | Hindu | Gujarati | PM @ Microsoft | Seattle |
| Aisha Khan | Female | Muslim | Hyderabadi | UX @ Meta | Austin |
| Arjun Reddy | Male | Hindu | Tamil | DS @ Amazon | New York |
| Simran Kaur | Female | Sikh | Punjabi | Doctor @ JHU | Toronto |
| Vikram Mehta | Male | Jain | Gujarati | IB @ Goldman | Chicago |
| Nadia Ahmed | Female | Muslim | Bengali | Marketing @ Spotify | Brooklyn |
| Rohan Gupta | Male | Hindu | Bengali | Engineer @ Tesla | Palo Alto |
