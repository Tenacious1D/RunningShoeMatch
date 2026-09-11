# Running Shoe Match

Running Shoe Match helps runners compare shoes using structured catalog data, versioned rankings, and—after its rules are approved—a deterministic guided matching quiz.

The application currently includes data-driven shoe and ranking pages, repository-managed MDX articles with live database embeds, secure CSV import workflows, a read-only private admin area, and clearly labeled development fixtures. The matching engine boundary deliberately fails closed: no quiz questions, match weights, or ranking formula have been invented.

## Technology

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Supabase using the official `@supabase/ssr` helpers
- ESLint
- npm

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment-variable template to `.env.local`:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. In the Supabase project, open the **Connect** dialog or **Settings → API Keys**. Replace the placeholders in `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
   ```

   Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY` only when running the local CSV import or ranking-publication commands. They are server-only and are never used by browser code.

4. Start or restart the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000/dev/database](http://localhost:3000/dev/database). Both checks should show **Yes**.

The diagnostics route exists only in development and never displays keys or secret values.

## Database development

The first schema lives in `supabase/migrations/` and is never applied implicitly by the web application. The Supabase CLI is pinned in the project.

Install and start Docker Desktop or another Docker-compatible runtime, then validate locally:

```bash
npx supabase start
npx supabase db reset --local
npm run db:validate
npx supabase test db --local supabase/tests/database
npx supabase db advisors --local
```

`db reset` applies the migrations and then `supabase/seed.sql`. To reapply the
idempotent demo inserts without resetting the local database, run:

```bash
npm run db:seed
npm run db:validate
```

All seed records are fictional, visibly marked `DEVELOPMENT/DEMO`, and use
reserved `.example` retailer URLs. Never seed a production project.

To apply a reviewed migration to the hosted project, authenticate and link the CLI, run a dry run, then push deliberately:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --linked --dry-run
npx supabase db push --linked
npx supabase db advisors --linked
```

For a linked **development-only** project, the guarded seed command requires an
explicit PowerShell confirmation and verifies that the CLI link matches
`.env.local`:

```powershell
$env:RSM_ALLOW_LINKED_DEMO_SEED = "YES"
npm run db:seed:linked
Remove-Item Env:RSM_ALLOW_LINKED_DEMO_SEED
npm run db:validate:linked
```

Do not put the database password, access token, or secret API key in source files or command history.

## Data imports

Both import workflows require an explicit mode. Always dry-run the reviewed CSV first:

```powershell
npm run import:shoes -- data/imports/my-shoes.csv --dry-run
npm run import:shoes -- data/imports/my-shoes.csv --apply

npm run import:rankings -- data/imports/my-rankings.csv --dry-run
npm run import:rankings -- data/imports/my-rankings.csv --apply
npm run rankings:publish -- <ranking-run-id>
```

Shoe imports upsert by stable shoe slug. Ranking imports create an atomic draft snapshot and use a semantic content hash to make repeated imports idempotent. Publication is a separate transaction and never overwrites older published runs. See `docs/IMPORTING.md` and `docs/RANKING_IMPORTS.md` before importing real data.

## Implemented routes

- Public: `/`, `/quiz`, `/shoes`, `/shoes/[slug]`, `/rankings`, `/rankings/[slug]`, `/blog`, `/blog/[slug]`, `/about`, `/methodology`, `/affiliate-disclosure`, `/privacy`, and `/contact`
- Private: `/admin`, `/admin/shoes`, `/admin/rankings`, and `/admin/imports`
- Development only: `/dev/database` and `/design-system`
- SEO metadata: `/robots.txt` and `/sitemap.xml`

## Checks

```bash
npm test
npm run lint
npm run build
npm run db:validate
npx supabase test db --local supabase/tests/database
npx supabase db advisors --local
```

## Environment safety

Local environment files are ignored by Git. Only `.env.example`, which contains placeholders and no credentials, is committed. Never prefix the server-only Supabase secret key with `NEXT_PUBLIC_`.
