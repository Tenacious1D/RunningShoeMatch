<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Running Shoe Match project instructions

## Product boundaries

- Running Shoe Match is a deterministic running-shoe discovery and ranking application.
- Do not use an LLM to recommend or rank shoes.
- Do not implement speculative features. Build only what the current task requests.
- Treat `docs/` as the architectural source of truth. Update the relevant document when architecture changes.

## Coding rules

- Use TypeScript strictly. Avoid `any` unless it is absolutely unavoidable and documented.
- Prefer Server Components unless client interactivity is required.
- Keep business logic outside UI components.
- Keep database access isolated from presentation and domain logic.
- Never expose privileged Supabase credentials to browser code.
- Never commit `.env.local` or other secret-bearing environment files.
- Reuse components rather than duplicating page markup.
- Preserve accessible, semantic HTML and keyboard behavior.
- Build mobile-first interfaces.
- Run `npm run lint` and `npm run build` after meaningful changes.
- Never alter the database schema without creating or updating a migration.

## Architectural rules

- Quiz components collect answers; a separate matching engine produces recommendations.
- Ranking calculations live outside React components.
- Ranking publications are immutable snapshots. Never overwrite historical rankings.
- Resolve affiliate links from application data. Never hard-code them in components or MDX.
- Generate shoe detail pages from the dynamic `app/shoes/[slug]` route and database records.
- Keep blog articles as repository-managed MDX unless the architecture documentation is intentionally revised.

## Project map

- `app/`: routes, layouts, metadata, and request handlers
- `components/`: reusable UI components
- `lib/supabase/`: Supabase client construction and session handling
- `lib/admin/`: server-only authentication and explicit administrator authorization
- `lib/matching/`: framework-independent quiz normalization and deterministic matching boundary
- `scripts/import*.ts` and `scripts/import/`: local-only validated CSV import workflows, including transactional ranking snapshots
- `data/templates/`: version-controlled import contracts; `data/imports/`: reviewed source CSVs
- `docs/`: product and architecture decisions
- `content/blog/`: validated, repository-managed MDX blog content
- `supabase/migrations/`: reviewed database migrations

Before changing a subsystem, read its document in `docs/`.

For ranking updates, follow `docs/RANKING_IMPORTS.md`: dry-run first, create a draft with the importer, and publish only with the separate explicit command. Never update a published ranking run.
