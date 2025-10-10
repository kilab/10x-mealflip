import { pgTable, uuid, text, boolean, timestamp, bigserial, bigint, smallint, numeric, integer, date, index, uniqueIndex, check, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums: korzystamy z wartości tekstowych + CHECK; prawdziwe PG enums dodamy tylko gdy będą używane w kolumnach

// Users and Authentication Tables (Lucia Auth)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  hashedPassword: text('hashed_password'),
  googleId: text('google_id').unique(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_google_id_idx').on(table.googleId),
  index('users_is_admin_idx').on(table.isAdmin),
]);

export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('user_sessions_user_id_idx').on(table.userId),
  index('user_sessions_expires_at_idx').on(table.expiresAt),
]);

export const userKeys = pgTable('user_keys', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  hashedPassword: text('hashed_password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('user_keys_user_id_idx').on(table.userId),
]);

// User Profiles and Preferences
export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  defaultPrepTimeBucket: text('default_prep_time_bucket').notNull().default('30'),
  acceptedTermsAt: timestamp('accepted_terms_at', { withTimezone: true }),
  acceptedPrivacyAt: timestamp('accepted_privacy_at', { withTimezone: true }),
  locale: text('locale'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('locale_length', sql`length(${table.locale}) BETWEEN 2 AND 10`),
  check('default_prep_time_bucket_check', sql`${table.defaultPrepTimeBucket} IN ('15', '30', '45', '60')`),
]);

export const userDiets = pgTable('user_diets', {
  userId: uuid('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  dietId: smallint('diet_id').notNull().references(() => diets.id, { onDelete: 'restrict' }),
}, (table) => [
  primaryKey(table.userId, table.dietId),
  index('user_diets_diet_id_idx').on(table.dietId),
]);

export const favorites = pgTable('favorites', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('favorites_user_recipe_unique').on(table.userId, table.recipeId),
  index('favorites_user_id_idx').on(table.userId),
]);

export const userHiddenRecipes = pgTable('user_hidden_recipes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('user_hidden_recipes_user_recipe_unique').on(table.userId, table.recipeId),
  index('user_hidden_recipes_user_id_idx').on(table.userId),
]);

export const dailyPicks = pgTable('daily_picks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  forDate: date('for_date').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  recipeVersionId: bigint('recipe_version_id', { mode: 'number' }).references(() => recipeVersions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('daily_picks_user_date_unique').on(table.userId, table.forDate),
  index('daily_picks_user_id_idx').on(table.userId),
]);

export const publicShares = pgTable('public_shares', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  recipeVersionId: bigint('recipe_version_id', { mode: 'number' }).references(() => recipeVersions.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isEnabled: boolean('is_enabled').notNull().default(true),
}, (table) => [
  index('public_shares_recipe_version_id_idx').on(table.recipeVersionId),
  index('public_shares_user_id_idx').on(table.userId),
  // Note: Partial index with time functions removed due to PostgreSQL IMMUTABLE requirement
  // Can be added later with a different approach if needed
]);

// Recipes, Versions and Ingredients
export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  isBlocked: boolean('is_blocked').notNull().default(false),
  blockedAt: timestamp('blocked_at', { withTimezone: true }),
  blockedBy: uuid('blocked_by').references(() => profiles.userId, { onDelete: 'set null' }),
  currentVersionId: bigint('current_version_id', { mode: 'number' }).references(() => recipeVersions.id, { onDelete: 'set null' }),
}, (table) => [
  index('recipes_current_version_id_idx').on(table.currentVersionId),
  index('recipes_not_blocked_idx').on(table.id).where(sql`NOT ${table.isBlocked}`),
]);

export const recipeVersions = pgTable('recipe_versions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  titleNormalized: text('title_normalized').notNull(),
  instructions: text('instructions'),
  imageUrl: text('image_url'),
  prepTimeEstimate: smallint('prep_time_estimate'),
  qualityScore: smallint('quality_score'),
  source: text('source').notNull(),
  sourceId: text('source_id'),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
  validTo: timestamp('valid_to', { withTimezone: true }),
  isCurrent: boolean('is_current').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('recipe_versions_recipe_version_unique').on(table.recipeId, table.version),
  index('recipe_versions_recipe_current_idx').on(table.recipeId).where(sql`${table.isCurrent}`),
  index('recipe_versions_title_normalized_idx').on(table.titleNormalized),
  check('recipe_versions_quality_score_check', sql`${table.qualityScore} BETWEEN 0 AND 100`),
  check('recipe_versions_prep_time_check', sql`${table.prepTimeEstimate} >= 0`),
  check('recipe_versions_current_validity_check', sql`(${table.isCurrent} AND ${table.validTo} IS NULL) OR (NOT ${table.isCurrent} AND ${table.validTo} IS NOT NULL)`),
]);

export const ingredients = pgTable('ingredients', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  nameNormalized: text('name_normalized').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('ingredients_name_lower_unique').on(sql`lower(${table.name})`),
  uniqueIndex('ingredients_name_normalized_lower_unique').on(sql`lower(${table.nameNormalized})`),
]);

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  recipeVersionId: bigint('recipe_version_id', { mode: 'number' }).notNull().references(() => recipeVersions.id, { onDelete: 'cascade' }),
  ingredientId: bigint('ingredient_id', { mode: 'number' }).notNull().references(() => ingredients.id, { onDelete: 'restrict' }),
  position: smallint('position').notNull().default(0),
  measure: text('measure'),
  quantity: numeric('quantity', { precision: 10, scale: 2 }),
  unit: text('unit'),
}, (table) => [
  uniqueIndex('recipe_ingredients_version_ingredient_unique').on(table.recipeVersionId, table.ingredientId),
  index('recipe_ingredients_ingredient_id_idx').on(table.ingredientId),
  index('recipe_ingredients_recipe_version_id_idx').on(table.recipeVersionId),
]);

export const diets = pgTable('diets', {
  id: smallint('id').primaryKey().generatedByDefaultAsIdentity(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const recipeDiets = pgTable('recipe_diets', {
  recipeVersionId: bigint('recipe_version_id', { mode: 'number' }).notNull().references(() => recipeVersions.id, { onDelete: 'cascade' }),
  dietId: smallint('diet_id').notNull().references(() => diets.id, { onDelete: 'restrict' }),
}, (table) => [
  primaryKey(table.recipeVersionId, table.dietId),
  index('recipe_diets_diet_id_idx').on(table.dietId),
]);

export const attributions = pgTable('attributions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  recipeVersionId: bigint('recipe_version_id', { mode: 'number' }).notNull().references(() => recipeVersions.id, { onDelete: 'cascade' }),
  sourceName: text('source_name').notNull(),
  sourceUrl: text('source_url'),
  sourceId: text('source_id'),
  imageSourceUrl: text('image_source_url'),
  license: text('license'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('attributions_recipe_version_id_idx').on(table.recipeVersionId),
]);

// Draw History and Filters (with TTL 30 days)
export const drawHistory = pgTable('draw_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.userId, { onDelete: 'cascade' }),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  recipeVersionId: bigint('recipe_version_id', { mode: 'number' }).references(() => recipeVersions.id, { onDelete: 'set null' }),
  prepTimeBucket: text('prep_time_bucket').notNull(),
  sessionId: uuid('session_id'),
  seed: text('seed'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('draw_history_prep_time_bucket_check', sql`${table.prepTimeBucket} IN ('15', '30', '45', '60')`),
  index('draw_history_user_created_desc_idx').on(table.userId, table.createdAt.desc()),
  index('draw_history_user_recipe_created_desc_idx').on(table.userId, table.recipeId, table.createdAt.desc()),
]);

export const drawHistoryDiets = pgTable('draw_history_diets', {
  drawHistoryId: bigint('draw_history_id', { mode: 'number' }).notNull().references(() => drawHistory.id, { onDelete: 'cascade' }),
  dietId: smallint('diet_id').notNull().references(() => diets.id, { onDelete: 'restrict' }),
}, (table) => [
  primaryKey(table.drawHistoryId, table.dietId),
  index('draw_history_diets_diet_id_idx').on(table.dietId),
]);

// Content Moderation and Reports
export const contentReports = pgTable('content_reports', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  reportedBy: uuid('reported_by').references(() => profiles.userId, { onDelete: 'set null' }),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  categoryId: smallint('category_id').notNull().references(() => reportCategories.id, { onDelete: 'restrict' }),
  statusId: smallint('status_id').notNull().references(() => reportStatuses.id, { onDelete: 'restrict' }),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  processedBy: uuid('processed_by').references(() => profiles.userId, { onDelete: 'set null' }),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => [
  index('content_reports_recipe_id_idx').on(table.recipeId),
  index('content_reports_reported_by_idx').on(table.reportedBy),
  index('content_reports_status_id_idx').on(table.statusId),
  index('content_reports_created_at_desc_idx').on(table.createdAt.desc()),
]);

export const reportCategories = pgTable('report_categories', {
  id: smallint('id').primaryKey().generatedByDefaultAsIdentity(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
});

export const reportStatuses = pgTable('report_statuses', {
  id: smallint('id').primaryKey().generatedByDefaultAsIdentity(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
});

// Admin Audit
export const adminAudit = pgTable('admin_audit', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  actorUserId: uuid('actor_user_id').references(() => profiles.userId, { onDelete: 'set null' }),
  targetTable: text('target_table').notNull(),
  targetPk: text('target_pk').notNull(),
  action: text('action').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('admin_audit_target_table_pk_idx').on(table.targetTable, table.targetPk),
  index('admin_audit_created_at_desc_idx').on(table.createdAt.desc()),
]);

export const adminAuditFieldChanges = pgTable('admin_audit_field_changes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  auditId: bigint('audit_id', { mode: 'number' }).notNull().references(() => adminAudit.id, { onDelete: 'cascade' }),
  columnName: text('column_name').notNull(),
  beforeValue: text('before_value'),
  afterValue: text('after_value'),
}, (table) => [
  index('admin_audit_field_changes_audit_id_idx').on(table.auditId),
]);

// Import/ETL and Source Attribution
export const importBatches = pgTable('import_batches', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sourceName: text('source_name').notNull(),
  externalBatchId: text('external_batch_id').unique(),
  status: text('status').notNull().default('running'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  insertedCount: integer('inserted_count').notNull().default(0),
  updatedCount: integer('updated_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
}, (table) => [
  index('import_batches_source_status_idx').on(table.sourceName, table.status),
  index('import_batches_started_at_desc_idx').on(table.startedAt.desc()),
]);

export const sourceRecords = pgTable('source_records', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  batchId: bigint('batch_id', { mode: 'number' }).notNull().references(() => importBatches.id, { onDelete: 'cascade' }),
  sourceName: text('source_name').notNull(),
  externalId: text('external_id').notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  recipeVersionId: bigint('recipe_version_id', { mode: 'number' }).references(() => recipeVersions.id, { onDelete: 'set null' }),
  operation: text('operation').notNull(),
  titleRaw: text('title_raw'),
  titleNormalized: text('title_normalized'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('source_records_source_external_unique').on(table.sourceName, table.externalId),
  index('source_records_batch_id_idx').on(table.batchId),
  index('source_records_recipe_id_idx').on(table.recipeId),
  index('source_records_recipe_version_id_idx').on(table.recipeVersionId),
]);

// Relacje można dodać później, jeśli będą potrzebne do typed joins i optymalizacji zapytań

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type UserKey = typeof userKeys.$inferSelect;
export type NewUserKey = typeof userKeys.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;

export type UserHiddenRecipe = typeof userHiddenRecipes.$inferSelect;
export type NewUserHiddenRecipe = typeof userHiddenRecipes.$inferInsert;

export type DailyPick = typeof dailyPicks.$inferSelect;
export type NewDailyPick = typeof dailyPicks.$inferInsert;

export type PublicShare = typeof publicShares.$inferSelect;
export type NewPublicShare = typeof publicShares.$inferInsert;

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

export type RecipeVersion = typeof recipeVersions.$inferSelect;
export type NewRecipeVersion = typeof recipeVersions.$inferInsert;

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert;

export type Diet = typeof diets.$inferSelect;
export type NewDiet = typeof diets.$inferInsert;

export type RecipeDiet = typeof recipeDiets.$inferSelect;
export type NewRecipeDiet = typeof recipeDiets.$inferInsert;

export type Attribution = typeof attributions.$inferSelect;
export type NewAttribution = typeof attributions.$inferInsert;

export type DrawHistory = typeof drawHistory.$inferSelect;
export type NewDrawHistory = typeof drawHistory.$inferInsert;

export type DrawHistoryDiet = typeof drawHistoryDiets.$inferSelect;
export type NewDrawHistoryDiet = typeof drawHistoryDiets.$inferInsert;

export type ContentReport = typeof contentReports.$inferSelect;
export type NewContentReport = typeof contentReports.$inferInsert;

export type ReportCategory = typeof reportCategories.$inferSelect;
export type NewReportCategory = typeof reportCategories.$inferInsert;

export type ReportStatus = typeof reportStatuses.$inferSelect;
export type NewReportStatus = typeof reportStatuses.$inferInsert;

export type AdminAudit = typeof adminAudit.$inferSelect;
export type NewAdminAudit = typeof adminAudit.$inferInsert;

export type AdminAuditFieldChange = typeof adminAuditFieldChanges.$inferSelect;
export type NewAdminAuditFieldChange = typeof adminAuditFieldChanges.$inferInsert;

export type ImportBatch = typeof importBatches.$inferSelect;
export type NewImportBatch = typeof importBatches.$inferInsert;

export type SourceRecord = typeof sourceRecords.$inferSelect;
export type NewSourceRecord = typeof sourceRecords.$inferInsert;
