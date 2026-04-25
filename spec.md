# SPEC.md — Rishta

## What it is

Rishta is a modern matrimonial platform for the South Asian diaspora. It combines the traditional biodata format families trust with a sleek, privacy-first digital experience. Families and individuals can create profiles, set preferences, express interest, and connect — all without the cringe of dating apps.

Tagline: **"Rishta Aaya Hai"**

---

## MVP Scope

### Core User Flows

**Flow 1: Profile Creation**
1. User signs up → creates a biodata profile
2. Basic info: name, age, gender, height, religion, community/caste, mother tongue
3. Education + career: degree, university, profession, employer, income range
4. Family details: family type (joint/nuclear), father's occupation, mother's occupation, siblings
5. Lifestyle: diet (veg/non-veg/eggetarian/vegan), smoking, drinking, horoscope (optional)
6. About me: free text bio, what you're looking for
7. Photos: up to 5 photos, primary photo

**Flow 2: Preference Setting**
1. User sets partner preferences (age range, height range, religion, community, education level, profession type, location, diet)
2. These preferences power the matching algorithm
3. "Deal-breakers" vs "nice-to-haves" distinction

**Flow 3: Browse & Discover**
1. Browse profiles that match your preferences
2. Filter/sort by age, education, location, community
3. View biodata cards with key details visible
4. Click to see full profile

**Flow 4: Interest & Matching**
1. Express interest in a profile → sends notification
2. Other side can: Accept, Decline, or Shortlist
3. On mutual accept → "Match!" → contact details revealed
4. Chat/messaging between matches (Phase 2)

**Flow 5: Family Involvement**
1. Parent/family member can create a profile on behalf of their child
2. Profile marked as "Created by Family"
3. Family members can browse and express interest

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Overview: profile completion, new interests received, matches |
| My Profile | `/profile` | View/edit your own biodata |
| Edit Profile | `/profile/edit` | Full profile edit form |
| Browse | `/browse` | Discover profiles matching your preferences |
| Profile View | `/browse/[id]` | View someone's full biodata |
| Interests | `/interests` | Interests sent/received with accept/decline |
| Matches | `/matches` | Mutual matches with contact details |
| Preferences | `/preferences` | Set partner preference filters |
| Shortlist | `/shortlist` | Saved/bookmarked profiles |

### Data Model (Drizzle Schema)

```
biodata_profile
  id              uuid PK
  userId          uuid FK → user (unique — one profile per user)
  displayName     text NOT NULL          -- "Priya S." or "Rahul K."
  gender          text NOT NULL          -- "male", "female"
  dateOfBirth     text NOT NULL          -- YYYY-MM-DD
  height          integer               -- in cm
  religion        text NOT NULL          -- "hindu", "muslim", "sikh", "christian", "jain", "buddhist", "other"
  community       text                   -- "punjabi", "gujarati", "tamil", "bengali", etc.
  motherTongue    text                   -- language
  maritalStatus   text DEFAULT "never_married"  -- "never_married", "divorced", "widowed", "annulled"
  education       text                   -- "bachelors", "masters", "phd", "diploma", "other"
  university      text
  profession      text                   -- "engineer", "doctor", "lawyer", "business", "teacher", etc.
  employer        text
  incomeRange     text                   -- "under_50k", "50k_75k", "75k_100k", "100k_150k", "150k_plus", "prefer_not_to_say"
  familyType      text                   -- "joint", "nuclear"
  fatherOccupation text
  motherOccupation text
  siblings        text                   -- "1 brother, 2 sisters" free text
  diet            text DEFAULT "non_veg" -- "veg", "non_veg", "eggetarian", "vegan", "jain_veg"
  smoking         text DEFAULT "never"   -- "never", "occasionally", "regularly"
  drinking        text DEFAULT "never"   -- "never", "occasionally", "socially", "regularly"
  aboutMe         text                   -- free text bio
  lookingFor      text                   -- what they want in a partner
  createdBy       text DEFAULT "self"    -- "self", "parent", "sibling", "relative"
  location        text                   -- city, state, country
  isActive        boolean DEFAULT true
  isVerified      boolean DEFAULT false
  profilePhoto    text                   -- URL to primary photo
  createdAt       timestamp
  updatedAt       timestamp

partner_preference
  id              uuid PK
  userId          uuid FK → user (unique)
  ageMin          integer               -- e.g. 25
  ageMax          integer               -- e.g. 32
  heightMin       integer               -- cm
  heightMax       integer               -- cm
  religions       text                   -- JSON array: ["hindu", "sikh"]
  communities     text                   -- JSON array: ["punjabi", "gujarati"]
  educationLevels text                   -- JSON array: ["bachelors", "masters", "phd"]
  professions     text                   -- JSON array
  locations       text                   -- JSON array of cities/countries
  diet            text                   -- JSON array: ["veg", "eggetarian"]
  maritalStatus   text                   -- JSON array: ["never_married"]
  createdAt       timestamp
  updatedAt       timestamp

interest
  id              uuid PK
  fromUserId      uuid FK → user
  toUserId        uuid FK → user
  status          text DEFAULT "pending" -- "pending", "accepted", "declined", "withdrawn"
  message         text                   -- optional intro message
  createdAt       timestamp
  updatedAt       timestamp
  UNIQUE(fromUserId, toUserId)

shortlist
  id              uuid PK
  userId          uuid FK → user
  profileUserId   uuid FK → user         -- the person they shortlisted
  createdAt       timestamp
  UNIQUE(userId, profileUserId)
```

### Derived Concepts

| Concept | Logic |
|---------|-------|
| **Match** | Both users have accepted interests from each other |
| **Compatibility %** | Count of preference fields that match ÷ total preference fields |
| **Profile Completeness** | Count of filled fields ÷ total fields × 100 |
| **Age** | Calculated from dateOfBirth |

### Acceptance Criteria

- [ ] User can create/edit biodata profile
- [ ] User can upload profile photo
- [ ] User can set partner preferences
- [ ] Browse page shows filtered profiles
- [ ] User can express interest
- [ ] User can accept/decline interests
- [ ] Matched users can see each other's contact info
- [ ] Shortlist/bookmark profiles
- [ ] "Created by Family" badge on family-created profiles
- [ ] Profile completeness indicator
- [ ] Dark mode (default)

### Architecture Decisions

- **No chat (Phase 1)** — After matching, show contact details (phone/email). Chat is Phase 2
- **No payments (Phase 1)** — Free to use. Premium tier (more interests/day, profile boost) is Phase 2
- **Organization = not used** — This is a personal app, not team-based. Disable org requirement
- **Privacy** — Photos visible to all, but contact info only revealed on mutual match
- **Gender-based browsing** — Males see female profiles, females see male profiles (default, configurable)

### Design Direction

- **Dark mode default** — deep, warm tones
- **Rose/burgundy accent** — romantic but dignified, not dating-app flashy
- **Traditional meets modern** — Biodata format in a card UI with clean typography
- **Outfit display font + Inter body** — same premium stack as MasjidStock
- **Loading skeletons** — no $0 blip, learned from MasjidStock
- **Client components with TanStack Query** — instant data refresh, learned from MasjidStock
