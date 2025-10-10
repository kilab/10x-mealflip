# Database Layer

This directory contains the database schema, migrations, and client configuration for the 10x MealFlip application.

## Overview

- **ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Lucia Auth with custom user tables
- **Migrations**: Drizzle Kit for schema management
- **Database**: PostgreSQL 18 (Docker image `postgres:18-alpine`)

## Files

- `schema.ts` - Database schema definitions with TypeScript types
- `client.ts` - Database client configuration
- `migrations/` - Generated SQL migration files
- `README.md` - This documentation

## Available Scripts

```bash
# Generate new migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Open Drizzle Studio (database browser)
npm run db:studio
```

## Schema Overview

### Authentication Tables
- `users` - Main user accounts (Lucia Auth)
- `user_sessions` - Active user sessions
- `user_keys` - Authentication keys

### User Data Tables
- `profiles` - User profiles and preferences
- `favorites` - User's favorite recipes
- `user_hidden_recipes` - Recipes hidden by users
- `user_diets` - User's diet preferences
- `daily_picks` - Daily recipe recommendations

### Content Tables
- `recipes` - Recipe metadata
- `recipe_versions` - Versioned recipe content (SCD2)
- `ingredients` - Ingredient definitions
- `recipe_ingredients` - Recipe-ingredient relationships
- `diets` - Diet categories
- `recipe_diets` - Recipe-diet relationships
- `attributions` - Content source attributions

### Activity Tracking
- `draw_history` - Recipe draw history with TTL
- `draw_history_diets` - Diet filters used in draws
- `public_shares` - Shared recipe links

### Moderation
- `content_reports` - User-reported issues
- `report_categories` - Report types
- `report_statuses` - Report statuses

### ETL and Audit
- `import_batches` - External data import tracking
- `source_records` - Imported recipe records
- `admin_audit` - Administrative actions
- `admin_audit_field_changes` - Detailed audit changes

## Development Workflow

1. **Make schema changes** in `schema.ts`
2. **Generate migrations**: `npm run db:generate`
3. **Review migration SQL** in `migrations/` folder
4. **Apply to database**: `npm run db:migrate`
5. **Update TypeScript types** if needed

## Database Connection

The database client in `client.ts` uses the `DATABASE_URL` environment variable. Make sure it's set in your `.env` file:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/mealflip_dev"
# Optional: tune connection pool size (defaults: prod=10, dev=1)
DB_POOL_MAX=10
```

## Lucia Auth Integration

The schema includes tables required by Lucia Auth:
- `users` - Extended with `is_admin` flag
- `user_sessions` - Session management
- `user_keys` - Authentication keys

## Security Notes

- No Row Level Security (RLS) implemented at database level
- Access control handled at application level with Drizzle queries
- Sensitive data protected through proper query construction
- Admin actions logged in `admin_audit` table

## Migration Guidelines

- Always review generated SQL before applying
- Test migrations on development database first
- Use descriptive commit messages for schema changes
- Consider data migration scripts for complex changes

## Troubleshooting

### Migration Issues
```bash
# Reset database and reapply all migrations
docker-compose down -v
docker-compose up -d postgres
npm run db:migrate
```

### Connection Issues
```bash
# Check if database is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Connect directly to database
docker-compose exec postgres psql -U postgres -d mealflip_dev
```

## Imports

You can import the database client and schema from `src/db/index.ts`:

```ts
import { db, recipes } from '@/db';
```
