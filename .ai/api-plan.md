## REST API Plan

### Base
- Base URL: `/api/v1`
- Content-Type: `application/json; charset=utf-8`
- Time format: ISO 8601 UTC (e.g., `2025-10-10T12:34:56Z`)
- IDs: UUID for user/recipe, bigint for versioned entities where applicable
- Auth: Session cookies (Lucia). Public endpoints explicitly marked.
- Versioning: URI-based (`/v1`), add deprecation headers when needed.

### Conventions
- Pagination: Cursor-based recommended for large lists; page/limit allowed for simple lists.
  - Query: `page` (default 1), `limit` (default 20, max 100) OR `cursor`, `limit`.
  - Response: `page`, `limit`, `total` (optional), `nextCursor` (when cursor-based).
- Sorting: `sort` param `field:direction` (e.g., `created_at:desc`). Whitelist fields per endpoint.
- Filtering: Plain query params (`diet=vegan&prep_time_lte=30`). Array by repeating: `diet=vegan&diet=gluten_free`.
- Error model:
```json
{
  "error": {
    "code": "string",  
    "message": "human readable",
    "details": {"field": "reason"},
    "requestId": "uuid"
  }
}
```
- Idempotency: For non-GET creations/side-effect calls support `Idempotency-Key` header; return same result for 24h.
- Caching: ETag/If-None-Match for GETs; public dictionaries cacheable 1h; user-scoped data `Cache-Control: private, max-age=0`.
- Security headers: `Strict-Transport-Security`, `X-Content-Type-Options`, `Content-Security-Policy` (SSR pages), `Referrer-Policy`.
- Rate limits (initial):
  - `POST /auth/magic-link`: 3/min per email + per IP
  - `POST /draw`: 15/min per user
  - `POST /shares`: 10/hour per user
  - Global: 1000/hour per IP (tunable)

# 1. Resources
- Users → table `users` (auth-managed, no public CRUD)
- Sessions → `user_sessions` (auth-managed)
- Profiles → `profiles`
- Favorites → `favorites`
- HiddenRecipes → `user_hidden_recipes`
- DailyPicks → `daily_picks`
- PublicShares → `public_shares`
- Recipes → `recipes`
- RecipeVersions → `recipe_versions`
- Ingredients → `ingredients`
- RecipeIngredients → `recipe_ingredients`
- Diets → `diets`
- RecipeDiets → `recipe_diets`
- Attributions → `attributions`
- DrawHistory → `draw_history`, `draw_history_diets`
- ContentReports → `content_reports`, with dictionaries `report_categories`, `report_statuses`
- AdminAudit → `admin_audit`, `admin_audit_field_changes`
- ImportBatches → `import_batches`
- SourceRecords → `source_records`
- Events (analytics) → external store (PostHog) or minimal DB table (optional)

# 2. Endpoints

Note: All endpoints require authentication unless marked as Public.

## Auth
- POST `/auth/magic-link`
  - Description: Request a magic login link.
  - Body:
  ```json
  {"email": "user@example.com", "redirectUrl": "https://app.example.com/login/complete"}
  ```
  - Success: `202 Accepted` (email queued)
  - Errors: `400 invalid_email`, `429 rate_limited`

- POST `/auth/magic-link/consume`
  - Description: Exchange token for session cookie.
  - Body: `{ "token": "string" }`
  - Success: `200 OK` + sets HttpOnly session cookie; Response `{ "userId": "uuid" }`
  - Errors: `400 invalid_token`, `410 token_expired`

- GET `/auth/google/start`
  - Description: Redirect to Google OAuth. Success: `302 Found` to provider.

- GET `/auth/google/callback`
  - Description: OAuth callback; creates/links account; sets session cookie; `302` to app URL.

- GET `/auth/session`
  - Description: Get current session and user profile snapshot.
  - Response:
  ```json
  {"userId": "uuid", "email": "user@example.com", "isAdmin": false}
  ```

- POST `/auth/logout`
  - Description: Invalidate current session. Success: `204 No Content`.

## Profile & Preferences
- GET `/profile`
  - Response:
  ```json
  {
    "userId":"uuid",
    "displayName": "string|null",
    "defaultPrepTimeBucket": 30,
    "locale": "pl-PL",
    "acceptedTermsAt": "2025-10-10T12:34:56Z|null",
    "acceptedPrivacyAt": "2025-10-10T12:34:56Z|null",
    "diets": [ {"id":1, "code":"vegetarian", "name":"Wegetariańska"} ]
  }
  ```

- PATCH `/profile`
  - Body (partial):
  ```json
  {
    "displayName": "string",
    "defaultPrepTimeBucket": 15,
    "locale": "pl",
    "accept": {"terms": true, "privacy": true}
  }
  ```
  - Success: `200 OK` returns updated profile
  - Errors: `400 invalid_prep_time_bucket` (allowed: 15,30,45,60)

- PUT `/profile/diets`
  - Description: Replace user's diet preferences.
  - Body: `{ "dietIds": [1,2,3] }`
  - Success: `204 No Content`

- GET `/diets` (Public)
  - Description: List available diets. Supports ETag and 1h cache.

## Recipes & Versions
- GET `/recipes`
  - Description: List discoverable recipes (not blocked). Server uses current version join.
  - Query: `q`, `dietId` (repeatable), `prep_time_lte`, `quality_gte`, `page`, `limit`, `sort` (`title_normalized:asc`, `created_at:desc`), `expand` (`currentVersion`)
  - Response (simplified):
  ```json
  {
    "items": [
      {"id":"uuid", "currentVersionId":123, "isBlocked":false, "title":"...", "imageUrl":"..."}
    ],
    "page":1, "limit":20, "total": 100
  }
  ```

- GET `/recipes/{recipeId}`
  - Description: Get a recipe with optional expansions.
  - Query: `expand=ingredients,diets,attribution,currentVersion`
  - Response includes latest current version by default.

- GET `/recipe-versions/{versionId}`
  - Description: Fetch a specific immutable version.
  - Response:
  ```json
  {
    "id":123,
    "recipeId":"uuid",
    "version":2,
    "title":"...",
    "instructions":"...",
    "imageUrl":"...",
    "prepTimeEstimate":30,
    "qualityScore":85,
    "isCurrent":true,
    "ingredients":[{"ingredientId":10,"name":"Onion","measure":"1 pc"}],
    "diets":[{"id":1,"code":"vegetarian"}],
    "attribution":{"sourceName":"TheMealDB","sourceUrl":"https://..."}
  }
  ```

- GET `/ingredients`
  - Description: Search ingredients by name; for admin/tools.
  - Query: `q`, `limit`

## Favorites
- GET `/favorites`
  - Description: List user's favorite recipes (current versions).
  - Query: `page`, `limit`

- PUT `/recipes/{recipeId}/favorite`
  - Description: Add to favorites. Idempotent by unique `(userId, recipeId)`.
  - Success: `204 No Content`
  - Errors: `404 recipe_not_found`

- DELETE `/recipes/{recipeId}/favorite`
  - Description: Remove from favorites. `204 No Content`.

## Hidden Recipes (Blacklisting)
- GET `/hidden`
  - Description: List recipes hidden by user.

- PUT `/recipes/{recipeId}/hide`
  - Description: Hide recipe permanently for the user.
  - Success: `204 No Content`

- DELETE `/recipes/{recipeId}/hide`
  - Description: Unhide. `204 No Content`.

## Draw, Reroll, History, Daily Pick
- POST `/draw`
  - Description: Perform a draw according to filters and diversity rules.
  - Body:
  ```json
  {
    "filters": {"prepTimeBucket": 30, "dietIds": [1,2]},
    "seed": "optional-string", 
    "excludeLast": 20
  }
  ```
  - Behavior:
    - Excludes user's last N results (default 20)
    - Filters by diet and prep time; quality threshold and ingredient count heuristics
    - Records to `draw_history` (+ `draw_history_diets`)
  - Response: `{ "recipeVersionId":123, "recipeId":"uuid", "title":"...", "imageUrl":"..." }`
  - Errors: `404 no_match`, `429 rate_limited`

- GET `/history`
  - Description: List last draws (TTL 30 days). Query: `page`, `limit` (max 50).
  - Response includes timestamp and recipe snapshot.

- GET `/daily-pick`
  - Description: Get or initialize today's daily pick for the user (24h stable).
  - Response: same shape as `/recipe-versions/{id}` minimal fields.

## Public Shares
- POST `/shares`
  - Description: Create a public share for a recipe version.
  - Body: `{ "recipeVersionId": 123, "expiresAt": "2025-12-31T23:59:59Z|null" }`
  - Response:
  ```json
  {"id":"uuid","slug":"abc123","url":"https://app.example.com/s/abc123","isEnabled":true,"expiresAt":null}
  ```
  - Errors: `404 version_not_found`, `422 disabled_by_policy`

- GET `/shares`
  - Description: List user's shares.

- PATCH `/shares/{id}`
  - Description: Enable/disable or update expiry.
  - Body: `{ "isEnabled": false, "expiresAt": null }`

- DELETE `/shares/{id}`
  - Description: Delete share.

- GET `/public/shares/{slug}` (Public)
  - Description: Resolve slug to share details for SSR. Always `X-Robots-Tag: noindex`.
  - Response (public-safe):
  ```json
  {"slug":"abc123","recipeVersion":{"id":123,"title":"...","imageUrl":"...","attribution":{"sourceName":"TheMealDB","sourceUrl":"..."}}}
  ```
  - Errors: `404 not_found`, `410 expired_or_disabled`

## Content Reports
- POST `/reports`
  - Description: Create a content report on a recipe.
  - Body: `{ "recipeId":"uuid", "categoryId":1, "comment":"text" }`
  - Success: `201 Created` → `{ "id": 10 }`

- GET `/reports/my`
  - Description: List reports submitted by current user.

- GET `/report-categories` (Public)
- GET `/report-statuses` (Admin/Public read)

## Admin (role: is_admin)
- GET `/admin/reports`
  - Query: `statusId`, `page`, `limit`

- PATCH `/admin/reports/{id}`
  - Description: Update status, add processor and timestamps. Audit logged.
  - Body: `{ "statusId": 2, "reason": "string" }`

- PATCH `/admin/recipes/{recipeId}/block`
  - Body: `{ "isBlocked": true, "reason": "string" }`
  - Effect: updates `recipes.is_blocked`, sets `blocked_at/by`; logged to `admin_audit`.

- PATCH `/admin/recipe-versions/{versionId}`
  - Description: Curate version metadata (tags/diets/time).
  - Body (partial): `{ "prepTimeEstimate": 30, "dietIds": [1,2] }`

- POST `/admin/recipe-versions/{versionId}/attributions`
  - Body: `{ "sourceName":"TheMealDB", "sourceUrl":"https://...", "imageSourceUrl": null, "license": null }`

- POST `/admin/import-batches`
  - Description: Start import (snapshot/incremental). Returns batch id.

- GET `/admin/import-batches`
- GET `/admin/import-batches/{id}`
- GET `/admin/source-records`
  - Query: `sourceName`, `externalId`, `recipeId`, `versionId`, `page`, `limit`

## Events (Analytics)
- POST `/events`
  - Description: Capture client analytics when PostHog is not directly used.
  - Body:
  ```json
  {
    "name":"draw_click",
    "properties":{"prepTimeBucket":30,"dietIds":[1]},
    "timestamp":"2025-10-10T12:34:56Z"
  }
  ```
  - Success: `202 Accepted`

## Meta
- GET `/health` (Public): liveness
- GET `/ready` (Public): readiness (DB/queue)
- GET `/version` (Public): build/version commit

# 3. Authentication and Authorization
- Mechanism: Lucia Auth session cookies (HttpOnly, Secure, SameSite=Lax). SSR-friendly.
- Identity: `users` table; sessions in `user_sessions`; keys in `user_keys`.
- Admin: `users.is_admin = true` grants access to `/admin/**` endpoints.
- Access control:
  - Per-user data (`profiles`, `favorites`, `user_hidden_recipes`, `draw_history`, `daily_picks`, `shares`) requires `userId == session.userId` or admin.
  - Public content: `recipes` (not blocked, current versions), `diets`, report dictionaries, public shares.
- CSRF: Protected via SameSite cookies; for non-idempotent requests require either double-submit token header `X-CSRF-Token` or Origin checks (SSR forms).
- OAuth Google: Redirect flow under `/auth/google/*` endpoints.

# 4. Validation and Business Logic

## Validation per resource (selected)
- Profile
  - `defaultPrepTimeBucket` ∈ {15,30,45,60}
  - `locale` length 2..10
- Favorites
  - Unique `(userId, recipeId)`; 404 if recipe blocked or not available.
- Hidden recipes
  - Unique `(userId, recipeId)`; idempotent PUT.
- Daily picks
  - Unique `(userId, for_date)`; 24h stability rule.
- Public shares
  - `slug` unique; active only when `is_enabled` and not expired.
- Recipes/Versions
  - Read public only when `recipes.is_blocked = false` and `recipe_versions.is_current = true` (unless admin or specific version ID).
- Content reports
  - `categoryId` and `statusId` reference dictionaries.
- Draw history
  - Partitioned by month; keep only last 30 days for user-facing history.

## Draw logic
- Input filters: `prepTimeBucket` (bucketed into ≤15/30/45/60+), `dietIds`.
- Diversity: Exclude last N (default 20) via index `(user_id, recipe_id, created_at DESC)`.
- Quality: Prefer `quality_score >= threshold` (configurable), prefer recipes with ≤12 ingredients; fallback image placeholder when missing/low quality.
- Seed: If not provided, derive from `hash(userId + date + filters)` for reproducibility per day/filters.
- Persistence: Record selection in `draw_history` with diets to enable analytics/exclusions.

## Daily pick
- Generated lazily on first GET per UTC day (`for_date`).
- Reuses draw logic with user’s current filters at creation time; does not change within 24h even if filters change.

## Shares
- Only for existing `recipe_version_id`. Public endpoint validates `is_enabled` and `expires_at > now()`.
- SSR pages must always send `X-Robots-Tag: noindex`.

## Moderation
- Admin can block/unblock recipes (`recipes.is_blocked`) and curate version metadata.
- All admin changes write to `admin_audit` + `admin_audit_field_changes` with reason and actor.

## Security and rate limiting
- IP + user-based limits using token bucket; `429` with `Retry-After`.
- Abuse controls for shares and report submissions.
- Validation errors return `400` with `details` per field.

## Request/Response schema examples

### Error
```json
{
  "error": {
    "code": "invalid_prep_time_bucket",
    "message": "Allowed values are 15, 30, 45, 60",
    "details": {"defaultPrepTimeBucket": 10},
    "requestId": "b1f7e7f8-..."
  }
}
```

### Pagination wrapper
```json
{
  "items": [/* ... */],
  "page": 1,
  "limit": 20,
  "total": 123
}
```

### Recipe list item
```json
{
  "id": "6b3c...",
  "currentVersionId": 123,
  "title": "Spaghetti Carbonara",
  "imageUrl": "https://cdn/...",
  "prepTimeEstimate": 30,
  "qualityScore": 88,
  "diets": ["vegetarian"]
}
```

### Report item
```json
{
  "id": 10,
  "recipeId": "uuid",
  "category": {"id":1,"code":"bad_data"},
  "status": {"id":1,"code":"open"},
  "comment": "...",
  "createdAt": "..."
}
```

## HTTP status and common errors
- 200 OK, 201 Created, 202 Accepted, 204 No Content
- 304 Not Modified (ETag)
- 400 Bad Request (validation), 401 Unauthorized, 403 Forbidden, 404 Not Found
- 409 Conflict (uniqueness), 410 Gone (expired share), 422 Unprocessable Entity (business rule)
- 429 Too Many Requests, 500 Internal Server Error

## Notes on implementation (stack alignment)
- Astro 5 SSR endpoints under `src/pages/api`, TypeScript, Drizzle ORM for DB, Lucia for auth.
- DB indexes used by queries:
  - `recipes`: partial index where `NOT is_blocked`
  - `recipe_versions`: partial index where `is_current`; `title_normalized` for search
  - `draw_history`: (`user_id`, `recipe_id`, `created_at DESC`) for exclusion; monthly partitions
  - `public_shares`: partial index for active share resolution
  - `favorites`, `user_hidden_recipes`: unique constraints for idempotent toggles
- Observability: instrument API with Sentry; include `requestId` in error responses and logs.


