# DocBridge

Platforma profesionale shqiptare për gjetjen e noterëve, përkthyesve dhe kurseve — me panel admini, karusel reklamash dhe sistem autentikimi me role.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/web run dev` — run the React frontend (port auto)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase project credentials (frontend auth)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite, Tailwind CSS, shadcn/ui, Framer Motion, Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (Replit provisioned)
- Auth: Supabase (frontend via @supabase/supabase-js)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — DB schema (ads, notaries, translators, courses, users)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/web/src/pages/` — all frontend pages
- `artifacts/web/src/hooks/useAuth.tsx` — Supabase auth context
- `artifacts/web/src/lib/supabase.ts` — Supabase client init

## Architecture decisions

- Supabase handles auth on the frontend only; backend uses `x-user-id` header for identity (passed from Supabase session)
- Replit PostgreSQL is used for all domain data (notaries, translators, courses, ads, users)
- Notaries and translators must be approved by admin before appearing in public listings
- API schema is contract-first (OpenAPI spec → codegen → typed hooks + Zod)
- Albanian Red (`hsl(352, 82%, 43%)`) as primary color, dark secondary for hero/footer

## Product

- **Home**: animated ad carousel, featured professionals, hero section
- **Noterë**: searchable/filterable list of approved notaries
- **Përkthyes**: searchable list by name and language
- **Kurse**: course catalog with category filters
- **Detail pages**: contact info, bio, direct call/email links
- **Register**: multi-step role selector (customer / notary / translator)
- **Admin Panel**: stats dashboard, ad CRUD (create/edit/delete), pending approvals

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after changing db schema before checking api-server
- Backend returns early with `res.json(); return;` pattern (Express 5 + TypeScript strict)
- Supabase placeholder values in `supabase.ts` keep the app from crashing before credentials are set

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
