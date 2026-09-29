# Rishta

A private, respectful way to be introduced for marriage, built around the biodata page families
already write. Each evening a candidate reads a small folio of complete pages, writes a sealed note
to someone whose page moved them, and both seals break when they both say yes. Family helps in the
margin, through a private link in their own language.

- Product and positioning: `vision.md`
- Features, data model and API: `spec.md`
- Design contract (IA, screens, tokens, type, motion, marketing): `design.md`
- Rules for coding agents: `claude.md`, `agents.md`

## Apps

| App              | What it is                                                           |
| ---------------- | -------------------------------------------------------------------- |
| `apps/saas`      | The product: Folio, Letters, My Biodata, households and family links |
| `apps/marketing` | The founders' letter homepage, Safety, Notes and legal pages         |
| `apps/docs`      | Help: getting started and feature guides                             |

Built with Next.js 16, Drizzle ORM, Better Auth, Stripe and oRPC, in a pnpm and Turborepo monorepo.
Use `pnpm` only.
