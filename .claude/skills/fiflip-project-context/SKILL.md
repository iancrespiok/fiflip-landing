---
name: fiflip-project-context
description: Fast orientation for the Fiflip real estate project — the fiflip-landing (React/Vite frontend) and fiflip-backend (Spring Boot) repos together. Covers full-stack architecture, the lead-capture pipeline, the admin panel, deployment locations, and a list of non-obvious gotchas discovered through trial and error (Spring Boot 4 artifact renames, Kafka serializer deprecations, Railway SMTP blocking, Meta CAPI UI limitations, etc). Consult this at the start of any session touching either repo, and before assuming stack details, dependency artifact names, or deployment steps — guessing on this project has repeatedly cost real debugging time, and the answers are already documented here.
---

# Fiflip project context

Fiflip (fiflip.realestate) has two wings: renovation leads (refacciones) and
real-estate flipping investment leads. This skill orients a fresh session
fast — read it in full before touching either repo.

## Repos and where things are deployed

| Piece | Repo | Deploys to | Auto-deploy |
|---|---|---|---|
| Frontend | `iancrespiok/fiflip-landing` | Vercel | on push to `main` |
| Backend | `iancrespiok/fiflip-backend` | Railway (project "observant-exploration", service `fiflip-backend`) | on push to `main` |
| Database | — | Railway Postgres addon, same project | — |
| Kafka | — | Redpanda Cloud Serverless, cluster `welcome` (AWS us-east-1) | — |
| Image storage | — | Cloudflare R2, bucket `fiflip-backend` | — |
| Email | — | Resend (HTTP API, not SMTP) | — |
| Ad tracking | — | Meta dataset "FiFlip Landing Page", pixel id `1353577153419443` | — |

Local backend builds need `JAVA_HOME` set explicitly (Homebrew's openjdk
isn't on PATH by default) and a Maven repo outside `~/.m2` — the sandbox
blocks writes there, so pass `-Dmaven.repo.local=<scratchpad>/m2`.

## Architecture

```
React/Vite (Vercel) ──POST /api/leads/*──> Spring Boot (Railway)
                                                │
                                          KafkaTemplate.send
                                                ▼
                                Redpanda topics: leads.renovation, leads.investor
                                                │
                                          @KafkaListener (LeadConsumer)
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                                   ▼
                   Resend HTTP API (email)           Meta Conversions API (ad event)

Postgres (Railway, JPA/Hibernate ddl-auto=update) — Project entity (portfolio)
Cloudflare R2 (S3-compatible) — project images, uploaded via backend proxy endpoint
```

No Redis yet despite it being in the original stack ask — not built because
nothing has needed it so far. Don't assume it exists.

## Lead capture flow

Two forms (renovation, investor) POST to `/api/leads/renovation` and
`/api/leads/investor`. Both DTOs carry: `nombre`, `email`, `telefono`,
form-specific fields, an `eventId` and `customEventId` (client-generated
UUIDs), plus `ipAddress`/`userAgent` filled in server-side by
`LeadController` (from `X-Forwarded-For`/`User-Agent`, not trusted from the
client).

`LeadController` publishes to Kafka; `LeadConsumer` then:
1. Sends the email notification (`LeadNotificationService`, Resend HTTP API).
2. Fires **two** Meta Conversions API events (`MetaConversionsService`):
   - Generic `Lead` (used for campaign optimization).
   - A per-intent custom event, so separate retargeting audiences can be
     built per funnel:
     - Renovation `tipo` → `LeadVenderMasCaro` / `LeadListoParaMudarte` /
       `LeadRefaccion` / `LeadRenovacionOtro` (see
       `LeadConsumer.renovationCustomEventName`).
     - Investor → `LeadInversion`.

The frontend fires the matching client-side Pixel events
(`fbq('track', 'Lead', ..., {eventID})` and
`fbq('trackCustom', <name>, ..., {eventID})`) using the **same** `eventId`/
`customEventId` sent to the backend, so Meta dedupes browser + server
events instead of double-counting. If you add a new lead field or funnel
branch, keep both sides (frontend Pixel call, backend CAPI call) in sync —
mismatched event names break dedup silently.

## Admin panel (`/admin/projects`)

No router library — `App.jsx` does simple `pathname` + `pushState`-based
routing (see the shared `navigate()` helper). Vercel needs SPA rewrites in
`vercel.json` for `/admin/*` and `/proyecto/:id` to not 404 on direct load.

Auth is a single shared password (`ADMIN_PASSWORD` env var), not per-user
accounts — `POST /api/admin/login` issues a signed token
(`ADMIN_TOKEN_SECRET`), and `AdminAuthInterceptor` guards everything under
`/api/admin/**` except `/login`. This is intentionally minimal (solo admin,
low stakes) — don't upgrade it to full user management unless asked.

Portfolio projects (`Project` entity) have: title, description, category
(`RENOVATION`/`FLIP`), a cover image, `beforeImageUrls`/`afterImageUrls`
(ordered `@ElementCollection`s), optional `status`/`tea`/`teaProjected`
(FLIP only), and `projectDate` (month/year, drives sort order — **not**
`createdAt`). Images upload immediately on file-input selection (not
deferred to form submit) via `POST /api/admin/uploads` → R2, which is what
makes drag-to-reorder possible before saving. Reordering uses `@dnd-kit`
(native HTML5 drag-and-drop was tried first and rejected — no touch
support, felt janky; dnd-kit fixed both).

Public-facing: `PortfolioSection.jsx` (gallery with Refacciones/Flips
tabs) and `ProjectDetailPage.jsx` (own page per project, black-background
"Antes" carousel, white-background "Después" carousel, click-to-lightbox).
`InvestSection.jsx` also pulls the 3 most recent `FLIP` projects as
investment opportunity cards — same `Project` data, different view.

## Budget calculator (`/presupuesto`)

Multi-step wizard (`BudgetCalculatorPage.jsx`): room count → per room
(type BAÑO/COCINA/HABITACIÓN + m² + a yes/no checklist specific to that
type, see `QUESTIONS`) → estimated total with margin applied → a
lead-capture CTA that reuses `POST /api/leads/renovation` (so calculator
users land in the same pipeline as the regular form, with the itemized
breakdown stuffed into `descripcion`).

Pricing is entirely admin-editable (`pricing_items` table /
`PricingItem` entity, `/api/budget/pricing` public GET, protected
`/api/admin/budget/pricing` PUT, edited from the "Precios" tab
in `/admin/projects`, next to "Proyectos"). Every line item carries
**material and labor as separate rows** (`<key>_material_fixed` /
`<key>_labor_fixed`, or `_material_m2` / `_labor_m2` for area-based
ones) — the frontend sums both. Paint is the one exception: it's a
formula, not a flat per-m² price — `paint_labor_m2` (labor) plus
however many paint/enduido buckets and fijador units the m² requires,
computed from separate `*_coverage_m2` (`PricingUnit.COVERAGE_M2`)
"yield" rows also editable in admin (see `paintCost()` in
`BudgetCalculatorPage.jsx` and the `PINTURA` group in the pricing
catalog). `PricingSeeder` keeps the catalog in sync on every boot
(deletes superseded keys, inserts missing ones, never touches a value
an admin already edited for a key that still exists) — see gotcha #9
below before adding another `PricingUnit` value.

## Design system

Strict monochrome black/white brutalist look — bold 2px borders, hard
edges, no rounded corners, no color accents. This was an explicit user
decision (asked once, confirmed "100% blanco y negro"); don't introduce an
accent color without checking first. Fonts: Archivo Black (headings, all
caps) + Space Grotesk (body).

## Gotchas (each cost real debugging time — check here before re-deriving)

1. **Spring Boot 4 renamed starter artifacts.** It's not
   `spring-boot-starter-web`, it's `spring-boot-starter-webmvc`. Not
   `spring-kafka` as a direct dep, it's `spring-boot-starter-kafka`. Not
   `org.springframework.boot.autoconfigure.kafka.KafkaProperties`, it's
   `org.springframework.boot.kafka.autoconfigure.KafkaProperties`. Don't
   guess artifact names from memory — fetch the real ones first:
   `curl -s "https://start.spring.io/pom.xml?dependencies=X,Y&type=maven-project&javaVersion=21"`.

2. **Spring Kafka's `JsonSerializer`/`JsonDeserializer` are deprecated**
   under Jackson 3 (Boot 4 ships Jackson 3 by default; classic
   `com.fasterxml.jackson` is test-scope only). Use
   `JacksonJsonSerializer`/`JacksonJsonDeserializer` instead — same API
   shape, different package.

3. **Never add `spring-boot-starter-mail` / use SMTP on Railway.** Railway
   blocks outbound SMTP ports, so the actuator's `MailHealthIndicator`
   hangs ~135 seconds trying to connect, which makes `/actuator/health`
   (and everything gated behind it) appear to hang too. This project sends
   email via Resend's **HTTP API** (`RestClient` POST to
   `api.resend.com/emails`) specifically to avoid this — don't switch back
   to SMTP.

4. **Meta's Custom Audience / Custom Conversion creation UI won't list a
   custom event** until it has accumulated real volume, even when the
   event is already firing successfully via CAPI (confirmed via "Probar
   eventos" showing it as processed). This is a UI-only limitation of the
   dropdown, not a bug in the integration. The workaround if it's urgent:
   create the audience directly via the Marketing API
   (`POST /act_<id>/customaudiences`) with an explicit event-name rule,
   which isn't gated the same way — but that needs an `ads_management`
   token from Graph API Explorer, not the CAPI system-user token.

5. **Railway's Postgres addon doesn't auto-inject its vars into other
   services.** After adding the Postgres plugin (in the *same* Railway
   project as `fiflip-backend`, not a separate one), you still have to add
   `PGHOST=${{Postgres.PGHOST}}` (and `PGPORT`/`PGDATABASE`/`PGUSER`/
   `PGPASSWORD`) to `fiflip-backend`'s own Variables tab.

6. **New `NOT NULL` columns on `Project` will break the live deploy** if
   the table already has rows, since `ddl-auto=update` can't backfill a
   default. Add new required-looking fields as nullable at the JPA level
   first (`private LocalDate projectDate;`, no `@Column(nullable=false)`),
   enforce "required" only in the DTO/admin-form validation, and only
   tighten the DB constraint later via a real migration if it matters.

7. **Don't push backend changes to `main` speculatively** when they depend
   on infrastructure that isn't provisioned yet (a new Postgres table, R2
   bucket, env var). Railway auto-deploys on push and will crash-loop the
   *whole* service — including the parts that already work (Kafka, email)
   — if the new code can't start. Build and verify locally
   (`mvn package`, H2 in-memory datasource in tests) first; only push once
   the required infra/env vars are confirmed in place, or use a feature
   branch if they aren't yet.

8. **Vercel's bot-protection interstitial ("Vercel Security Checkpoint")**
   can make `curl` against the live site return 403 even though the site
   is fine — it's blocking the non-browser request, not reporting a real
   outage. Verify through the actual Browser tool (which solves the
   challenge automatically) before concluding the deploy is broken.

9. **Adding a value to a Java enum used with `@Enumerated(EnumType.STRING)`
   can crash the app on next deploy**, even though it compiles fine and
   the local H2 tests pass. Hibernate's `ddl-auto=update` generates a
   Postgres `CHECK` constraint listing the enum's literal values *at the
   moment the column is first created*, and never widens that constraint
   later — so the first insert using the new value gets rejected
   (`violates check constraint "<table>_<column>_check"`) and
   `CommandLineRunner`/seeder beans that run at startup take the whole
   app down with them. H2 doesn't reproduce this (its `create-drop` test
   datasource always starts from a fresh schema), so this only shows up
   against the real Postgres — check Railway's Deploy Logs for
   `DataIntegrityViolationException` / `ConstraintViolationException` if
   a deploy is stuck "Crashed" with no obvious cause. Fix: drop the stale
   constraint before it's needed, e.g. from the seeder itself via
   `JdbcTemplate.execute("ALTER TABLE <table> DROP CONSTRAINT IF EXISTS <table>_<column>_check")`
   (see `PricingSeeder` for the pattern — it now does this defensively on
   every boot). `budget/` (the `/presupuesto` calculator) is the module
   this happened in; watch for it again if `PricingUnit` or `Project`'s
   enums grow another value.
