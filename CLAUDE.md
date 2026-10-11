# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read the `fiflip-project-context` skill (`.claude/skills/fiflip-project-context/SKILL.md`) at the start of any session.** It documents the full-stack architecture (this repo + `fiflip-backend`), the lead/Meta Pixel pipeline, the admin panel, the budget calculator, deployment, and hard-won gotchas. Don't duplicate that content here — update the skill when those facts change.

## Commands

```bash
npm install
npm run dev       # Vite dev server on :5173 (also defined in .claude/launch.json)
npm run build     # production build to dist/ — this is the only CI check
npm run preview   # serve the built dist/
```

There is no test suite, linter, or formatter configured. CI (`.github/workflows/ci.yml`) just runs `npm ci && npm run build` on Node 20, so "it builds" is the verification bar — confirm UI changes by running the app.

`VITE_API_URL` (see `.env.example`, set in `.env.local`) points at the Spring Boot backend; locally that's `http://localhost:8080`. Every fetch in the app is `${import.meta.env.VITE_API_URL}/api/...`, declared per file — there's no shared API client.

## Architecture

Plain React 18 + Vite SPA, JavaScript/JSX (no TypeScript), no router library, no state library. Only runtime dependency beyond React is `@dnd-kit` (admin image reordering).

- **Routing**: `src/App.jsx` switches on `window.location.pathname` (`/admin*` → `AdminApp`, `/proyecto/:id` → `ProjectDetailPage`, `/presupuesto` → `BudgetCalculatorPage`, otherwise the landing sections). Navigate with `navigate()` from `src/router.js`, which pushes state and dispatches `popstate`. `vercel.json` rewrites every path to `index.html` so deep links work.
- **Public site**: `src/components/` — the landing page is a stack of section components; `RenovationSection` and `InvestSection` hold the two lead forms.
- **Admin**: `src/admin/` — password login stores a token in `localStorage` (`fiflip_admin_token`), sent as a bearer header to `/api/admin/**`. Tabs for projects (`AdminProjectsPage`) and budget pricing (`AdminBudgetPricingPage`).
- **Image uploads**: `src/images.js` downscales photos in the browser (canvas → JPEG, 1800 px max, 960 px for covers) before uploading; images upload as soon as they're selected, not on form submit.
- **Meta Pixel**: the base pixel is inlined in `index.html`; lead forms fire `fbq` events with client-generated event IDs that must match what's sent to the backend (see the skill for the dedup contract).
- **Styling**: global classes and fonts in `src/index.css`, plus heavy use of inline `style={{}}` objects in components. Strict black-and-white brutalist design — no accent colors, no rounded corners.

## Conventions

- UI copy and code comments are in Spanish. The brand is spelled **FiFlip**.
- Work lands on `main` via PRs; Vercel auto-deploys `main`. Changes that need new backend endpoints/fields should be deployed backend-first.
