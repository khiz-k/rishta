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

Key files, coding rules and verification commands for this repo are in **claude.md**. The
template guide below still applies wherever it doesn't conflict with these rules.

---

# Coding Agent Guidelines

> Comprehensive guide for AI coding agents working with this Next.js codebase.

## Purpose

Use this document whenever generating or updating code in this repository. Mirror existing project conventions; do not invent new patterns without a strong reason.

---

## Technology Stack

You are an expert in:

- **TypeScript** – Strict typing, interfaces over type aliases
- **Node.js** – Server-side runtime (≥20)
- **Next.js App Router** – React Server Components, layouts, route handlers
- **React** – Functional components, hooks
- **Shadcn UI & Radix** – Accessible, composable primitives
- **Tailwind CSS** – Utility-first styling
- **oRPC** – Type-safe RPC layer
- **Better Auth** – Authentication with passkeys, magic links, organizations
- **Drizzle/Prisma** – Database ORM
- **React Hook Form + Zod** – Forms and validation
- **TanStack Query** – Client-side data fetching and caching

---

## Architecture Overview

### Monorepo Structure

```
/
├── apps/
│   ├── marketing/               # Marketing site (public pages, blog, changelog)
│   │   ├── app/[locale]/        # App Router routes
│   │   ├── modules/             # Feature modules
│   │   │   ├── home/            # Home page components
│   │   │   ├── blog/            # Blog components
│   │   │   ├── changelog/       # Changelog components
│   │   │   ├── shared/          # Cross-cutting components
│   │   │   └── analytics/       # Analytics providers
│   │   ├── content/             # MDX content (legal, blog posts)
│   │   └── tests/               # Playwright E2E tests
│   ├── saas/                    # SaaS application (protected app)
│   │   ├── app/                 # App Router routes
│   │   │   ├── (unauthenticated)/  # Login, signup, forgot-password
│   │   │   ├── (authenticated)/    # Protected routes, account, organizations
│   │   │   └── api/             # API route handlers
│   │   └── modules/             # Feature modules
│   │       ├── auth/            # Authentication components
│   │       ├── organizations/   # Organization management
│   │       ├── settings/        # User & account settings
│   │       ├── payments/        # Billing & subscriptions
│   │       ├── admin/           # Admin panel
│   │       ├── shared/          # Cross-cutting components
│   │       └── ...
│   ├── docs/                    # Documentation site
│   └── mail-preview/            # Email template preview
├── packages/                    # Shared backend packages
│   ├── api/                     # oRPC procedures and HTTP handlers
│   ├── auth/                    # Better Auth configuration
│   ├── database/                # Prisma/Drizzle schema and queries
│   ├── ai/                      # AI integrations
│   ├── i18n/                    # Translations and locale utilities
│   ├── logs/                    # Logging configuration
│   ├── mail/                    # Email providers and templates
│   ├── payments/                # Payment processing (Stripe, etc.)
│   ├── storage/                 # File storage (S3, etc.)
│   ├── ui/                      # Shadcn UI components
│   └── utils/                   # Shared utility functions
└── tooling/                     # Build tooling and shared configs
```

### Import Conventions

Use package exports instead of deep relative imports:

```typescript
// ✅ Good
import { auth } from "@repo/auth";
import { db } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";
import { orpcClient } from "@shared/lib/orpc-client";
import { config } from "@config";

// ❌ Bad
import { auth } from "../../../packages/auth/auth";
```

### Path Aliases

Path aliases are configured per app. Shared package aliases apply across the monorepo:

| Alias        | Path            |
| ------------ | --------------- |
| `@repo/*`    | `packages/*`    |
| `@repo/ui/*` | `packages/ui/*` |

**apps/saas** – SaaS application:

| Alias              | Path                                |
| ------------------ | ----------------------------------- |
| `@config`          | `apps/saas/config`                  |
| `@auth/*`          | `apps/saas/modules/auth/*`          |
| `@organizations/*` | `apps/saas/modules/organizations/*` |
| `@settings/*`      | `apps/saas/modules/settings/*`      |
| `@payments/*`      | `apps/saas/modules/payments/*`      |
| `@admin/*`         | `apps/saas/modules/admin/*`         |
| `@ai/*`            | `apps/saas/modules/ai/*`            |
| `@onboarding/*`    | `apps/saas/modules/onboarding/*`    |
| `@shared/*`        | `apps/saas/modules/shared/*`        |
| `@i18n/*`          | `apps/saas/modules/i18n/*`          |

**apps/marketing** – Marketing site:

| Alias                 | Path                                            |
| --------------------- | ----------------------------------------------- |
| `@config`             | `apps/marketing/config`                         |
| `@analytics`          | `apps/marketing/modules/analytics`              |
| `@home/*`             | `apps/marketing/modules/home/*`                 |
| `@blog/*`             | `apps/marketing/modules/blog/*`                 |
| `@changelog/*`        | `apps/marketing/modules/changelog/*`            |
| `@legal/*`            | `apps/marketing/modules/legal/*`                |
| `@shared/*`           | `apps/marketing/modules/shared/*`               |
| `@i18n/*`             | `apps/marketing/modules/i18n/*`                 |
| `content-collections` | `apps/marketing/.content-collections/generated` |

---

## Core Coding Principles

### TypeScript

- Write TypeScript everywhere; prefer interfaces over type aliases for object shapes
- Avoid enums; use maps/records or union literals instead
- Use functional components with TypeScript interfaces
- Export types alongside implementations when needed

```typescript
// ✅ Good
interface UserProps {
	name: string;
	email: string;
	isActive: boolean;
}

const USER_ROLES = {
	admin: "admin",
	user: "user",
} as const;

type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ❌ Bad
type UserProps = { name: string; email: string };
enum UserRole {
	Admin,
	User,
}
```

### Functions & Components

- Export React components as named functions; avoid default exports and classes
- Prefer pure functions declared with the `function` keyword
- Use descriptive camelCase identifiers (`isLoading`, `canSubmit`, `hasError`)
- Structure files: exported component, subcomponents, helpers, static content, types

```typescript
// ✅ Good
export function UserCard({ user }: UserCardProps) {
  const isActive = user.status === "active";
  return <div>{/* ... */}</div>;
}

function formatUserName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

// ❌ Bad
export default class UserCard extends Component {}
```

### Naming Conventions

| Type                | Convention            | Example                     |
| ------------------- | --------------------- | --------------------------- |
| Directories         | lowercase with dashes | `components/auth-wizard`    |
| Components          | PascalCase            | `LoginForm.tsx`             |
| Variables/Functions | camelCase             | `isLoading`, `handleSubmit` |
| Constants           | SCREAMING_SNAKE_CASE  | `MAX_RETRIES`               |
| Types/Interfaces    | PascalCase            | `UserProps`, `AuthConfig`   |

---

## React & Next.js Patterns

### Server vs Client Components

- **Default to React Server Components** – Only add `"use client"` when interactivity or browser APIs are required
- Keep client components small and focused
- Wrap client components in `Suspense` with tailored fallbacks

```typescript
// Server Component (default)
export async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId);
  return <UserCard user={user} />;
}

// Client Component (only when needed)
"use client";

export function InteractiveCounter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Minimize Client-Side State

- Minimize `useEffect` and `useState`; favor React Server Components
- Use `nuqs` for URL search parameter state management
- Avoid client components for data fetching or state management

### Data Fetching

- Use Next.js data-fetching primitives (Route Handlers, Server Actions, `fetch` with caching tags)
- Colocate route-specific helpers under the route directory
- Share cross-route logic via `apps/[app]/modules` (e.g. `apps/saas/modules`, `apps/marketing/modules`)
- Honor caching and revalidation patterns already in the repo

```typescript
// Server-side data fetching in layout/page
export default async function Layout({ children }: PropsWithChildren) {
	const session = await getSession();

	if (!session) {
		redirect("/login");
	}

	return children;
}
```

### Error Handling

- Use `notFound()`, `redirect()`, or custom error boundaries
- Don't throw raw errors; handle them gracefully

```typescript
import { notFound, redirect } from "next/navigation";

export default async function Page({ params }: PageProps) {
  const data = await getData(params.id);

  if (!data) {
    notFound();
  }

  if (!data.isAccessible) {
    redirect("/unauthorized");
  }

  return <Content data={data} />;
}
```

---

## API & Data Layer

### oRPC Procedures

API logic lives in `packages/api/modules`. Structure procedures with:

1. Route metadata (method, path, tags)
2. Input validation with Zod
3. Middleware (auth, locale)
4. Handler implementation

```typescript
// packages/api/modules/[feature]/procedures/[action].ts
import { publicProcedure, protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";

export const createItem = protectedProcedure
	.route({
		method: "POST",
		path: "/items",
		tags: ["Items"],
		summary: "Create a new item",
	})
	.input(
		z.object({
			name: z.string().min(1),
			description: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Implementation
	});
```

### Procedure Types

- `publicProcedure` – No authentication required
- `protectedProcedure` – Requires authenticated session
- `adminProcedure` – Requires admin role

### Database Queries

- Use the generated database clients from `@repo/database`
- Never instantiate Prisma or Drizzle directly in app code
- Keep queries in `packages/database/[orm]/queries/`

```typescript
// packages/database/drizzle/queries/users.ts
export async function getUserById(id: string) {
	return await db.query.user.findFirst({
		where: (user, { eq }) => eq(user.id, id),
	});
}
```

### Client-Side Data Fetching

Use TanStack Query with oRPC utilities:

```typescript
"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery } from "@tanstack/react-query";

export function ItemsList() {
	const { data, isLoading } = useQuery(orpc.items.list.queryOptions());

	const createMutation = useMutation(orpc.items.create.mutationOptions());

	// ...
}
```

### Notifications

- **Server:** Create notifications with `createNotification` from `@repo/notifications` (`userId`, `type`, optional JSON `data`, optional `link`). User preferences control whether a row is stored (in-app) and whether email is sent (`notification` mail template; `data.headline` / `data.title` / `data.message` drive copy when present).
- **Types:** New notification kinds require updating the `NotificationType` enum in the database schema and keeping `packages/notifications/src/types.ts` and `packages/notifications/src/catalog.ts` (`NOTIFICATION_GROUPS`, labels via `settings.notificationsPage` i18n) aligned.
- **API & UI:** oRPC lives in `packages/api/modules/notifications` (list, unread count, mark read, preferences). The SaaS app consumes these via TanStack Query (`orpc.notifications.*`); the notification center UI is under `apps/saas/modules/shared`.

---

## Authentication & Authorization

### Session Handling

- Use helpers from `@repo/auth` for session handling
- Server-side: `getSession()` from `@auth/lib/server`
- Client-side: `useSession()` hook from `@auth/hooks/use-session`

```typescript
// Server Component
import { getSession } from "@auth/lib/server";

export default async function ProtectedPage() {
	const session = await getSession();
	// ...
}

// Client Component
("use client");
import { useSession } from "@auth/hooks/use-session";

export function UserInfo() {
	const { user, loaded } = useSession();
	// ...
}
```

### Organization Scoping

- Respect organization scoping for multi-tenant features
- Access control helpers live in `apps/saas/modules/*/lib`
- Use `useActiveOrganization()` hook for organization context

```typescript
"use client";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";

export function OrgSettings() {
  const { activeOrganization, isOrganizationAdmin } = useActiveOrganization();

  if (!isOrganizationAdmin) {
    return <p>Access denied</p>;
  }

  // ...
}
```

### Auth Flow Consistency

When updating auth flows, ensure:

- Email templates in `packages/mail/emails` are updated
- Audit hooks remain consistent
- Locale detection works correctly

---

## UI & Styling

### Component Library

- Use Shadcn UI components from `@repo/ui/components`
- Compose with Radix primitives when customization is needed
- Import the `cn` helper for conditional class names

```typescript
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";

export function CustomButton({ variant, className }: Props) {
  return (
    <Button className={cn("custom-styles", className)} variant={variant}>
      Click me
    </Button>
  );
}
```

### Tailwind CSS

- Follow mobile-first responsive utility ordering
- Respect design tokens from `tooling/tailwind/theme.css`
- Use consistent spacing and color variables

```typescript
// Mobile-first responsive design
<div className="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">
  {/* Content */}
</div>
```

### Image Optimization

- Use `next/image` with explicit `width`/`height`
- Prefer WebP format when possible
- Implement lazy loading for non-critical visuals

```typescript
import Image from "next/image";

<Image
  src="/images/hero.webp"
  alt="Hero image"
  width={1200}
  height={630}
  priority={false}
  loading="lazy"
/>
```

---

## Forms & Validation

### Form Implementation

- Use `react-hook-form` for form state management
- Use `zod` for schema validation
- Reuse existing form abstractions before creating new ones

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    // Handle submission
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
      </form>
    </Form>
  );
}
```

### Shared Validation Schemas

- Define validation schemas in API module types for reuse
- Import schemas from `@repo/api/modules/[feature]/types`

```typescript
// packages/api/modules/contact/types.ts
import { z } from "zod";

export const contactFormSchema = z.object({
	name: z.string().min(1),
	email: z.email(),
	message: z.string().min(10),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
```

---

## Internationalization

### Translation Strings

- Source strings via i18n utilities in `packages/i18n`
- Keep translations scoped by surface: `marketing`, `saas`, `mail`, and `shared`
- Use `useTranslations()` hook in components
- Content collections live in `apps/marketing/content`

```typescript
import { useTranslations } from "next-intl";

export function WelcomeMessage() {
  const t = useTranslations();

  return (
    <h1>{t("home.welcome.title")}</h1>
  );
}
```

### Locale Handling

- Honor locale detection from `packages/i18n/config.ts`
- Use correct cookie naming conventions (`NEXT_LOCALE`)
- Load server-side message bundles through `getMessagesForLocale(locale, scope)`
- Server components: use `setRequestLocale(locale)`

```typescript
// Server Component with locale
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <Content />;
}
```

---

## Configuration

### Config files

Each package and application has its own config file to keep the config scoped.

If you need to access the config from a package, you can import it directly from the packages config file.

```typescript
import { config } from "@config";
import { config as i18nConfig } from "@repo/i18n";

// Access configuration
config.appName; // Application name
i18nConfig.defaultLocale; // Default locale
```

### Environment Variables

- Server-only variables: No prefix
- Client-accessible variables: `NEXT_PUBLIC_` prefix
- With the split apps, prefer SaaS-specific public URLs such as `NEXT_PUBLIC_SAAS_URL` for auth and app redirects
- Payment provider identifiers should stay server-only where possible; avoid exposing provider `priceId` values to the client unless the existing implementation already does
- Never commit secrets; use `.env.local`

---

## Tooling & Quality

### Package Manager

- Use **pnpm** for package management
- Run workspace-wide commands via **Turbo**

```bash
pnpm dev      # Start development server
pnpm build    # Build all packages
pnpm lint     # Run linting
pnpm format   # Format code
```

### Code Quality

- Linting and formatting use **Oxlint** and **Oxfmt**
- Lint all files before committing and fix all errors and warnings
- Format all files before committing
- Target Node.js ≥ 20 with ESM-compatible imports

### Testing

- E2E tests use **Playwright** in `apps/marketing/tests` and `apps/saas/tests`
- Run tests with `pnpm test` from the app directory or workspace root

### Adding Dependencies

- Add dependencies at the correct workspace package
- Prefer the workspace `catalog:` versions in `pnpm-workspace.yaml` when the dependency is already managed there
- Wire up exports through the relevant `index.ts`
- Use the latest stable versions

---

## Performance Optimization

### Core Web Vitals

Optimize for LCP, CLS, and FID:

- Minimize `"use client"` directives
- Use dynamic imports for non-critical components
- Implement proper image optimization
- Avoid layout shifts with proper sizing

```typescript
import dynamic from "next/dynamic";

// Lazy load non-critical components
const HeavyChart = dynamic(() => import("./HeavyChart"), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});
```

### Client Component Guidelines

Limit `"use client"` to:

- Components requiring browser APIs
- Interactive elements (forms, modals)
- Small, focused client boundaries

Avoid `"use client"` for:

- Data fetching
- Complex state management
- Layout components

---

## Documentation & Change Management

### Documentation Updates

- Update relevant MDX docs under `apps/marketing/content` when altering user-facing behavior
- Update `agents.md` when architectural conventions, app boundaries, aliases, or shared workflows change
- Keep README files current with setup instructions

### Changelog

- Log noteworthy changes in `CHANGELOG.md` for consumer-impacting changes
- Follow conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`

---

## Best Practices Summary

### When Adding Features

1. Inspect neighboring files for patterns before writing new code
2. Prefer incremental, well-scoped changes over sweeping rewrites
3. Ensure new features have corresponding server and client stories (UI, API, data layer, emails if needed)
4. Test the feature locally before considering it complete

### Code Review Checklist

- [ ] TypeScript types are accurate and complete
- [ ] No `any` types without justification
- [ ] Server Components used where possible
- [ ] Forms use react-hook-form + zod
- [ ] API procedures follow existing patterns
- [ ] Translations added for user-facing strings
- [ ] Mobile-first responsive design
- [ ] Accessibility considered (Radix primitives)
- [ ] No console.log statements in production code
- [ ] Oxlint linting passes

### When in Doubt

- Inspect neighboring files for patterns before writing new code
- Ask for clarification on product requirements rather than guessing
- Prefer incremental, well-scoped changes over sweeping rewrites
