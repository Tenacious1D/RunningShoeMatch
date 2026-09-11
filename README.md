# Running Shoe Match

Running Shoe Match will help runners find shoes suited to how they actually run. This repository contains the foundation for the future quiz, shoe database, rankings, shoe pages, affiliate links, editorial content, administration, and analytics.

The current application includes the public placeholder experience and Supabase SSR connection foundation. It does not yet include the database schema, quiz logic, or ranking algorithm.

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

   The optional `SUPABASE_URL` and `SUPABASE_SECRET_KEY` variables are reserved for future trusted server-side admin and import operations. They are not needed yet.

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
npx supabase test db --local supabase/tests/database
npx supabase db advisors --local
```

To apply a reviewed migration to the hosted project, authenticate and link the CLI, run a dry run, then push deliberately:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --linked --dry-run
npx supabase db push --linked
npx supabase db advisors --linked
```

Do not put the database password, access token, or secret API key in source files or command history.
## Checks

```bash
npm run lint
npm run build
```

## Environment safety

Local environment files are ignored by Git. Only `.env.example`, which contains placeholders and no credentials, is committed. Never prefix the server-only Supabase secret key with `NEXT_PUBLIC_`.