## Stack technologiczny — 10x-mealflip

### Przegląd
- Web PWA do szybkiego losowania pomysłów na obiad.
- Hybrydowy rendering: SSG dla treści publicznych, SSR dla strefy po zalogowaniu i stron udostępnianych.
- Wymagane konto przy akcji „Losuj” (magic link e‑mail, Google). Bez 2FA w MVP.
- Znormalizowany model danych (bez JSONB) na PostgreSQL (Supabase).

### Frontend
- Astro 5 jako warstwa kompozycji i routingu (SSG/SSR).
- React 19 dla komponentów interaktywnych (wybrane wyspy interaktywności).
- TypeScript 5 dla statycznego typowania i jakości IDE.
- Tailwind CSS 4 do szybkiego stylowania i systemu designu.
- shadcn/ui jako biblioteka dostępnych komponentów React.
- PWA: `@astrojs/pwa`, Service Worker ze strategią stale‑while‑revalidate, pre‑cache shell UI i ostatni przepis w offline.
- Wydajność: optymalizacja obrazów (WebP), lazy loading miniatur, docelowe wskaźniki LCP ≤ 2.5 s, P95 TTI ≤ 3 s.

### Backend i dane
- Supabase: PostgreSQL, Auth, Storage.
- Autentykacja: magic link e‑mail + Google OAuth; account linking po tym samym adresie e‑mail; rate‑limit 3/min; ważność linku 10 min.
- RLS (Row Level Security) dla izolacji danych użytkowników.
- ETL/synchronizacja: Edge Functions/cron (nocne inkrementy, snapshot startowy) do importu przepisów.
- Przechowywanie obrazów: Supabase Storage, transkodowanie do WebP, CDN TTL 7 dni.

### Model danych (znormalizowany)
- Tabele: `recipes`, `ingredients`, `recipe_ingredients`, `favorites`, `user_hidden_recipes`, `draw_history`, `attributions`.
- Kluczowe pola `recipes`: `title`, `image_url`, `instructions`, `diet_flags`, `prep_time_estimate`, `quality_score`, `source`, `source_id`, `version`.
- Indeksy pod filtry: `diet_flags`, `prep_time_estimate`; klucze obce w relacjach składników.

### Integracje zewnętrzne
- TheMealDB jako główne źródło przepisów: endpointy `random` i `lookup` z atrybucją.
  - Import: snapshot startowy + cotygodniowe inkrementy (ok. 02:00 UTC), wsady ~200, deduplikacja po znormalizowanym tytule i składnikach, wersjonowanie rekordów.
  - Obrazy: cache po naszej stronie (Storage) i serwowanie przez CDN.
  - Rozważenie planu premium w razie limitów API.
  - Odwołania: [TheMealDB](https://www.themealdb.com/), [API docs](https://www.themealdb.com/api.php)
- E‑mail (magic link): dedykowany SMTP (np. Postmark lub Resend) na subdomenie z DKIM/SPF.

### DevOps, CI/CD i hosting
- CI: GitHub Actions (Node 20) — kroki: lint, test, build, skan sekretów; budowa obrazu Docker.
- Hosting: DigitalOcean (App Platform lub droplet) z obrazem Docker.
- Previews: efemeryczne podglądy PR dla walidacji zmian.
- Rollout: canary 10% ruchu (ok. 2h) przed pełnym wdrożeniem; rollback przez redeploy poprzedniego obrazu; przechowywanie min. 5 artefaktów.
- Środowiska: dev i prod (bez stałego staging).

### Obserwowalność i analityka
- Sentry dla frontendu (przeglądarka) i SSR (serwerowe błędy i performance).
- Analityka zdarzeń: PostHog (self‑host na DO) lub eventy w Supabase; retencja 12 miesięcy; minimalizacja PII.
- Taksonomia eventów (MVP): `login_success`, `draw_click`, `reroll`, `filter_change`, `save_recipe`, `share_click`, `pwa_install`, `api_error` z `time_to_decision` i aktywnymi filtrami.
- SLO/SLA operacyjne: dostępność 99.5%, p95 TTFB SSR ≤ 500 ms; alerty do Slack kanału operacyjnego.

### Bezpieczeństwo, prywatność, zgodność
- RODO: minimalne PII, mechanizmy eksportu i usuwania danych, polityka prywatności/regulamin.
- RLS w Supabase, ścisłe uprawnienia Storage i audyt akcji admina.
- Rate‑limity akcji wrażliwych (logowanie, losowanie, udostępnienia) i ochrona przed nadużyciami.
- Atrybucja źródeł (TheMealDB) na stronach przepisu i udostępnianych.

### SEO i i18n
- Publiczny landing SSG z przyjaznym SEO.
- Strony udostępniania SSR; no‑index jeśli wymagane przez licencje.
- Interfejs w języku polskim; treści przepisów w oryginale na MVP; tłumaczenia jako etap późniejszy.


