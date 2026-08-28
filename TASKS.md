# Quipmed Store — Task Board

This file is the shared source of truth between the lead session and the subagents
(`payload-schema-agent`, `frontend-agent`, `data-import-agent`, `supabase-agent`, `qa-agent`).
The lead session updates this file as it delegates and reviews work — subagents should read
it for context, but only the lead moves items between sections after `qa-agent` verifies.

## How to use this file
- Each task has an owner (one of the five agents), a one-line acceptance criterion, and a status.
- Status values: `todo`, `in-progress`, `blocked`, `needs-qa`, `done`.
- A task moves to `done` only after qa-agent has checked it off — the owning agent should move
  it to `needs-qa`, not `done`, when it thinks it's finished.
- `blocked` tasks must say what they're blocked on (a decision, a credential, another task).

## Setup (done by this session, 2026-08-28)
- [x] Scaffolded Next.js + Payload CMS (ecommerce template) + Supabase Postgres/Storage — `quipmed-store/`
- [x] Pinned all `@payloadcms/*` + `payload` to `4.0.0-canary.29` (template targets unreleased v4 APIs)
- [x] shadcn/ui + Tailwind v4 verified working (`npx shadcn@latest add badge` succeeded)
- [x] Excel parser for `assets/UPDATED PRICE LIST QUIPMED NEW.xlsx` — `npm run seed:products -- --dry-run`
      → 326/360 rows parsed cleanly across 9 categories, 34 rows flagged for review

## Backlog — fill in before starting the agent loop

### payload-schema-agent
- [ ] todo — Decide category taxonomy: do the 9 spreadsheet categories map 1:1 to the Payload
      `categories` collection, or need re-grouping? (blocks data-import-agent)
- [ ] todo — Decide whether `packing`/`packType` from the spreadsheet become product variants
      (size/pack-type options) or plain display fields. (blocks data-import-agent)
- [ ] todo — Define the theme/section block types needed for the "Shopify-style editor" goal
      beyond what `plugin-ecommerce` + existing `src/blocks/` already provide.

### data-import-agent
- [ ] blocked — Resolve the 34 rows with unparseable price fields in `parsed-products.json`
      (blocked on: source data review — either fix the parser or confirm those rows are
      genuinely incomplete in the spreadsheet)
- [ ] blocked — Seed real Products/Categories into Payload (blocked on: payload-schema-agent's
      taxonomy/variant decisions above, and a real `DATABASE_URI`)
- [ ] todo — Source product images (none exist in the spreadsheet) — get plan from user

### supabase-agent
- [ ] blocked — Wire real Supabase credentials into `.env` (blocked on: user providing
      project URL, DB connection string, and S3 storage keys)
- [ ] todo — Verify Postgres connection + run first `payload migrate` once credentials land

### frontend-agent
- [ ] blocked — Apply design references (fonts, colors, screenshots) to storefront components
      (blocked on: user providing the actual assets)

### qa-agent
- [ ] todo — Establish baseline: `npx tsc --noEmit`, `npm run lint` pass/fail snapshot on the
      current scaffold, so future regressions are visible

## Hard checkpoints (never auto-approved by any agent)
- Pushing to `main` / any shared branch
- Any schema change or migration against the real (non-local) Supabase database
- Anything that touches real credentials/secrets
