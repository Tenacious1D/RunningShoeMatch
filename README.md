# Running Shoe Match

Running Shoe Match will help runners find shoes suited to how they actually run. This repository contains the foundation for the future quiz, shoe database, rankings, shoe pages, affiliate links, editorial content, administration, and analytics.

This first step intentionally does not implement the quiz, ranking algorithm, or database schema.

## Technology

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Supabase using the official server-side rendering helpers
- ESLint
- npm

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment-variable template:

   ```bash
   cp .env.example .env.local
   ```

3. Add the values from the API settings of your Supabase project:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

Then open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
npm run lint
npm run build
```

## Environment safety

Local environment files are ignored by Git. Only `.env.example`, which contains placeholders and no secrets, is committed.