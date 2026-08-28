# Running This Project With Claude Code Subagents — Setup Guide

This explains, in plain steps, how to run this project with a "lead engineer + specialist
agents" setup in Claude Code, using `/loop` to keep it moving without you babysitting the
terminal. Read this once, then use the prompt examples as templates.

---

## 1. The mental model

You are always the one talking to **one session** — the lead session. You never talk to
`payload-schema-agent` or `frontend-agent` directly. The lead:

1. Reads `TASKS.md` (already created in this repo).
2. Picks the next unblocked task.
3. Spawns the right subagent for it (using the `Agent` tool, with `.claude/agents/*.md`
   already defining `payload-schema-agent`, `frontend-agent`, `data-import-agent`,
   `supabase-agent`, `qa-agent`).
4. Waits for that agent to report back.
5. Sends the result to `qa-agent` to verify against the acceptance criterion.
6. Updates `TASKS.md` status, then moves to the next task — or stops and asks you, if it hit
   a "hard checkpoint" (real credentials, pushing to `main`, a real DB schema change).

Because you chose `/loop` (not a cloud/remote agent), **this still requires your laptop and
terminal to stay open and this Claude Code session to keep running** — `/loop` just stops you
from having to type "continue" every few minutes. It re-wakes the lead session on a timer so
it keeps working through the backlog on its own pace. If you close the laptop or the terminal,
it stops — that's the trade-off of not using a cloud/remote agent.

---

## 2. One-time setup (you do this once)

### 2.1 Already done for you in this repo
- `.claude/agents/payload-schema-agent.md`
- `.claude/agents/frontend-agent.md`
- `.claude/agents/data-import-agent.md`
- `.claude/agents/supabase-agent.md`
- `.claude/agents/qa-agent.md`
- `TASKS.md` — the shared task board

Claude Code automatically picks up any `.md` file in `.claude/agents/` as a subagent
definition — nothing to install. You can view/edit them any time with `/agents`.

### 2.2 What you still need to give the lead session
Paste these into the lead session before starting the loop (see prompt in step 3):
- **GitHub repo** — if you want this pushed somewhere, give the URL now; the lead will ask
  before ever pushing to `main` (hard checkpoint).
- **Supabase credentials** — project URL, `DATABASE_URI` (pooled connection string), and the
  S3-compatible storage keys (see the placeholders already in `.env.example`).
- **Design references** — screenshots, font files, hex color codes, and/or a Figma link.
- **Coding standards** — anything beyond what's already in this repo's ESLint/Prettier config.
- **Acceptance criteria** — as concrete as possible, one per feature. These get added to
  `TASKS.md`.

You do **not** need to re-explain the stack every time — it's already documented in this repo
(`README.md`, `TASKS.md`, and this guide).

---

## 3. Starting a work session

Open this project in Claude Code (`cd` into `quipmed-store`, run `claude`), then give the lead
session an orientation prompt. Example:

> **Prompt to the lead session:**
> "You're the lead engineer on this repo. Read `TASKS.md` and `.claude/agents/*.md` first.
> Here are the Supabase credentials and design references I promised: [paste/attach them].
> Add any new tasks these unblock to `TASKS.md`, then start working through the backlog —
> spawn the right subagent for each task, send finished work to `qa-agent` before marking
> anything done, and stop and ask me before any hard checkpoint (pushing to main, real DB
> schema changes, anything touching real secrets). Don't wait for me between tasks otherwise."

From here, start the loop so it keeps going without you re-prompting:

> **Prompt:** `/loop`

Since you ran `/loop` with no interval, the lead session self-paces — it decides when to wake
itself up again (usually every 20–30 min) to check on subagents and keep moving through
`TASKS.md`. You'll see it post short updates as it goes.

To check on progress at any point without interrupting, just ask normally — a mid-loop
question doesn't break the loop:

> **Prompt:** "What's the status on `TASKS.md` right now?"

To stop the loop (e.g. before closing your laptop):

> **Prompt:** `/loop stop`
(or just close the session — nothing is lost, `TASKS.md` reflects real state, and a fresh
session can pick up later by reading it.)

---

## 4. How the lead spawns a subagent (you don't type this — the lead does)

This is what's happening under the hood when the lead delegates a task, so you can read its
tool calls and understand what it's doing:

> **Lead's internal action (example):**
> Spawn agent `data-import-agent` with the task: "Resolve the 34 rows in
> `parsed-products.json` with unparseable price fields — see `TASKS.md` under
> `data-import-agent`. Fix the classifier in `seed-products.ts` if it's a parsing bug, or
> report back which rows are genuinely incomplete in the source spreadsheet."

The subagent works inside its own scoped tool list (defined in its `.md` file), reports back
to the lead, and the lead decides what happens next — send to `qa-agent`, mark blocked, or ask
you a question if it's genuinely your call to make (e.g. "these 6 rows have no rate at all —
do you want them excluded or do you have the real price?").

---

## 5. Prompt examples for common situations

**Kicking off a specific area of work directly (skip the loop, one task):**
> "Spawn `payload-schema-agent` and have it decide the category taxonomy question in
> `TASKS.md` — should the 9 spreadsheet categories map 1:1 to the `categories` collection?
> Report back its recommendation before implementing, since this affects data-import-agent."

**Asking for a cross-agent handoff explicitly:**
> "Once `payload-schema-agent` finishes the taxonomy decision, hand it to `data-import-agent`
> to unblock the product seeding task, then have `qa-agent` verify the seeded data matches the
> spreadsheet counts (326 products, 9 categories)."

**Providing design assets mid-loop:**
> "Here are the brand fonts (attached) and the homepage screenshot reference. Update
> `TASKS.md` to unblock the frontend-agent design task, and have frontend-agent apply these
> to the storefront."

**Handling a hard checkpoint the lead flagged:**
> Lead: "I'm ready to run the first real seed into Supabase — this writes ~326 rows. Confirm?"
> You: "Yes, go ahead." — or — "Hold off, let's review `parsed-products.json` first."

**Resuming after closing your laptop:**
> "Read `TASKS.md` and pick up where we left off."

---

## 6. Why this isn't fully hands-off, on purpose

A few things will always stop and wait for you, even mid-loop:
- Pushing to `main` or any shared branch
- Any schema change or migration against the **real** Supabase database (local/dev DB changes
  are fine to automate)
- Anything touching real credentials/secrets
- A genuine judgment call only you can make (e.g. "the spreadsheet has no price for this
  product — exclude it or ask the supplier?")

This is intentional — see `TASKS.md`'s "Hard checkpoints" section. If you want to loosen this
later (e.g. once you trust the flow on a staging Supabase project), say so explicitly and the
lead session can be told to treat staging-DB changes as auto-approved too — just not
production.

---

## 7. Known rough edges to expect

- **Payload is pinned to an unreleased canary build (`4.0.0-canary.29`)**, because the official
  `ecommerce` template's code targets APIs not yet in the stable `3.88.0` release (a `slug`
  field type, `TableFeature`, storage adapters moved to a top-level `storage` config array
  instead of `plugins`). This is already handled in `src/payload.config.ts` and
  `package.json`, but expect occasional upstream breakage since canary builds move fast — if
  `npm install` ever pulls a newer canary that breaks something, pin back to `4.0.0-canary.29`
  exactly rather than chasing `latest`.
- **Next.js 16.3.3** is newer than most training data cutoffs (including the agents'). Every
  `next dev` run regenerates `AGENTS.md` at the repo root pointing to
  `node_modules/next/dist/docs/` — the frontend-agent definition already tells it to check
  there before writing routing/data-fetching code.
- A handful of the ecommerce template's own demo seed fixtures (`src/endpoints/seed/*.ts`)
  have type errors against the canary lexical rich-text schema. These only affect the
  optional admin-panel "seed demo content" button, not real functionality — `npx tsc --noEmit`
  will show them; they're pre-existing template drift, not something introduced here. Worth
  cleaning up before a production `next build`, but not urgent.
