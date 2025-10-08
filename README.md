# 10x MealFlip

A PWA that helps you decide what to cook with one click. Users can set simple filters for prep time and diet. Recipes come from TheMealDB with clear attribution. Drawing a recipe requires an account (magic link e‑mail or Google).

## MVP scope (from PRD)

- Web PWA with onboarding filters (time, diet) and a Draw action behind login.
- Seeded draw with diversity: excludes last 20 results, soft limit of 5 rerolls/session, "Hide forever", and a 24h "Daily pick".
- Recipe view: title, image, ingredients with measures, instructions, source and attribution to TheMealDB. Placeholder image fallback.
- Favorites, history (last 50 with 30‑day TTL), shareable recipe pages (SSR, no‑index).
- Basic offline: last drawn recipe and shell PWA.
- Minimal admin panel at `/admin`: curation, blocks, tag corrections.
- Event analytics and performance KPIs.

## Tech stack

### Frontend
- Astro 5 (composition/routing; SSG for public, SSR for authenticated/share pages)
- React 19 (interactive islands)
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui

### Backend and data
- Supabase (PostgreSQL, Auth, Storage), normalized schema only
- Image caching in Storage; WebP; CDN TTL ~7 days

### Observability and analytics
- Sentry (browser + SSR)
- Event taxonomy: `login_success`, `draw_click`, `reroll`, `filter_change`, `confirm_choice`, `save_recipe`, `share_click`, `pwa_install`, `api_error`
- `time_to_decision = confirm_choice - first draw_click`

### CI/CD and hosting
- GitHub Actions (lint, test, build, secret scan)
- Docker image, deployed to DigitalOcean
- PR previews, canary rollout ~10% before full deploy

## Prerequisites

- Node.js v22.14.0 (as specified in `.nvmrc`)
- npm

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` with required variables:

```bash
SUPABASE_URL=...
SUPABASE_KEY=...
OPENROUTER_API_KEY=... # optional, if used
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

5. Preview the production build:

```bash
npm run preview
```

## Available scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format with Prettier

## Project structure

```md
.
├── src/
│   ├── layouts/           # Astro layouts
│   ├── pages/             # Astro pages (SSG/SSR)
│   │   └── api/           # API endpoints
│   ├── middleware/
│   │   └── index.ts       # Astro middleware
│   ├── db/                # Supabase clients and types
│   ├── types.ts           # Shared types (entities, DTOs)
│   ├── components/        # UI components (Astro & React)
│   │   └── ui/            # shadcn/ui components
│   ├── lib/               # Services and helpers
│   ├── assets/            # Static internal assets
│   └── styles/            # Global styles
├── public/                # Public assets
```

## PWA and offline

- Pre‑cache shell UI; stale‑while‑revalidate for data.
- Offline: the last drawn recipe is available without network.
- Installable PWA with install prompt.

## Product and data model highlights

- Draw seeded by `userId + date + active filters`; stable "Daily pick" for 24h.
- Exclude repeats from last 20 results and `user_hidden_recipes`.
- Soft limit of 5 rerolls per session with clear UX when exceeded.
- Normalized tables: `recipes`, `ingredients`, `recipe_ingredients`, `favorites`, `user_hidden_recipes`, `draw_history`, `attributions`.
- Indexes for `diet_flags` and `prep_time_estimate`.

## Security and privacy

- Supabase RLS, least privilege on Storage.
- Minimal PII; GDPR export/delete mechanisms planned.
- No secrets in client bundles; environment variables via `.env`.

## Attribution

Recipes are sourced from TheMealDB. Please include attribution on recipe pages.

- TheMealDB: https://www.themealdb.com/
- API: https://www.themealdb.com/api.php

## Contributing

- Follow the coding practices and code review rules in `.cursor/rules/`.
- Keep changes aligned with the PRD and analytics taxonomy.

## References

- PRD: `.ai/prd.md`
- Tech stack: `.ai/tech-stack.md`

## License

MIT
