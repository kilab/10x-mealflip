import type {
	User,
	Profile,
	Diet,
	Recipe,
	RecipeVersion,
	Ingredient,
	RecipeIngredient,
	Attribution,
	PublicShare,
	Favorite,
	UserHiddenRecipe,
	DailyPick,
	ContentReport,
	ReportCategory,
	ReportStatus,
} from "./db";

// Shared utility types
export type ISODateString = string; // e.g. "2025-10-10T12:34:56Z"
export type UUID = string; // uuid string
export type BigIntId = number; // numeric/bigint identifiers exposed as number in API

// Pagination
export interface PageMeta {
	page: number;
	limit: number;
	// total may be omitted for cursor-based pagination
	total?: number;
	nextCursor?: string | null;
}

export interface PaginatedResponse<T> extends PageMeta {
	items: T[];
}

// Error model
export interface ApiErrorDetails {
	[field: string]: unknown;
}
export interface ApiError {
	error: {
		code: string;
		message: string;
		details?: ApiErrorDetails;
		requestId: UUID;
	};
}

// ===== Auth =====
export interface RequestMagicLinkCommand {
	email: string;
	redirectUrl: string;
}

export interface ConsumeMagicLinkCommand {
	token: string;
}

export interface ConsumeMagicLinkResponse {
	userId: UUID;
}

export interface SessionSnapshotDTO {
	userId: UUID;
	email: User["email"];
	isAdmin: User["isAdmin"];
}

// ===== Profile & Preferences =====
export interface UserDietDTO {
	id: Diet["id"];
	code: Diet["code"];
	name: Diet["name"];
}

export interface ProfileDTO {
	userId: Profile["userId"];
	displayName: Profile["displayName"];
	defaultPrepTimeBucket: 15 | 30 | 45 | 60;
	locale: Profile["locale"];
	acceptedTermsAt: ISODateString | null;
	acceptedPrivacyAt: ISODateString | null;
	diets: UserDietDTO[];
}

export interface UpdateProfileCommand {
	displayName?: Profile["displayName"];
	defaultPrepTimeBucket?: 15 | 30 | 45 | 60;
	locale?: string; // validated to length 2..10
	accept?: { terms?: boolean; privacy?: boolean };
}

export interface ReplaceUserDietsCommand {
	dietIds: Array<Diet["id"]>;
}

// ===== Diets =====
export type DietDTO = Pick<Diet, "id" | "code" | "name">;

// ===== Recipes & Versions =====
export interface RecipeListItemDTO {
	id: Recipe["id"];
	currentVersionId: Recipe["currentVersionId"] | null;
	isBlocked: Recipe["isBlocked"];
	title?: RecipeVersion["title"]; // optional convenience field
	imageUrl?: RecipeVersion["imageUrl"] | null;
	prepTimeEstimate?: RecipeVersion["prepTimeEstimate"] | null;
	qualityScore?: RecipeVersion["qualityScore"] | null;
	diets?: Array<Diet["code"]>;
}

export type RecipeListResponseDTO = PaginatedResponse<RecipeListItemDTO>;

export interface RecipeIngredientDTO {
	ingredientId: Ingredient["id"];
	name: Ingredient["name"];
	measure: RecipeIngredient["measure"] | null;
}

export interface RecipeVersionDTO {
	id: RecipeVersion["id"];
	recipeId: RecipeVersion["recipeId"];
	version: RecipeVersion["version"];
	title: RecipeVersion["title"];
	instructions: RecipeVersion["instructions"] | null;
	imageUrl: RecipeVersion["imageUrl"] | null;
	prepTimeEstimate: RecipeVersion["prepTimeEstimate"] | null;
	qualityScore: RecipeVersion["qualityScore"] | null;
	isCurrent: RecipeVersion["isCurrent"];
	ingredients?: RecipeIngredientDTO[];
	diets?: Array<Pick<Diet, "id" | "code">>;
	attribution?: Pick<Attribution, "sourceName" | "sourceUrl" | "imageSourceUrl" | "license">;
}

export interface RecipeDTO {
	id: Recipe["id"];
	isBlocked: Recipe["isBlocked"];
	currentVersionId: Recipe["currentVersionId"] | null;
	currentVersion?: RecipeVersionDTO; // when expanded
}

// ===== Ingredients =====
export interface IngredientSearchItemDTO {
	id: Ingredient["id"];
	name: Ingredient["name"];
}

// ===== Favorites =====
export interface FavoriteListItemDTO {
	recipeId: Favorite["recipeId"];
	recipeVersionId: RecipeVersion["id"] | null;
	title: RecipeVersion["title"];
	imageUrl: RecipeVersion["imageUrl"] | null;
}
export type FavoriteListResponseDTO = PaginatedResponse<FavoriteListItemDTO>;

export type ToggleFavoriteCommand = {
	// path param: recipeId
};

// ===== Hidden Recipes =====
export interface HiddenRecipeListItemDTO {
	recipeId: UserHiddenRecipe["recipeId"];
	createdAt: ISODateString;
}
export type HiddenRecipeListResponseDTO = PaginatedResponse<HiddenRecipeListItemDTO>;

export type ToggleHiddenRecipeCommand = {
	// path param: recipeId
};

// ===== Draw, History, Daily Pick =====
export interface DrawFiltersDTO {
	prepTimeBucket: 15 | 30 | 45 | 60;
	dietIds?: Array<Diet["id"]>;
}

export interface DrawCommand {
	filters: DrawFiltersDTO;
	seed?: string;
	excludeLast?: number;
}

export interface DrawResultDTO {
	recipeVersionId: RecipeVersion["id"];
	recipeId: Recipe["id"];
	title: RecipeVersion["title"];
	imageUrl: RecipeVersion["imageUrl"] | null;
}

export interface DrawHistoryItemDTO extends DrawResultDTO {
	createdAt: ISODateString;
}
export type DrawHistoryResponseDTO = PaginatedResponse<DrawHistoryItemDTO>;

export type DailyPickDTO = Pick<RecipeVersionDTO, "id" | "title" | "imageUrl" | "attribution"> & {
	recipeId: RecipeVersion["recipeId"];
};

// ===== Public Shares =====
export interface CreateShareCommand {
	recipeVersionId: RecipeVersion["id"];
	expiresAt: ISODateString | null;
}

export interface ShareDTO {
	id: PublicShare["id"];
	slug: PublicShare["slug"];
	url: string;
	isEnabled: PublicShare["isEnabled"];
	expiresAt: ISODateString | null;
}

export interface UpdateShareCommand {
	isEnabled?: boolean;
	expiresAt?: ISODateString | null;
}

export interface PublicShareResolveDTO {
	slug: PublicShare["slug"];
	recipeVersion: Pick<RecipeVersionDTO, "id" | "title" | "imageUrl" | "attribution">;
}

// ===== Content Reports =====
export interface CreateReportCommand {
	recipeId: Recipe["id"];
	categoryId: ReportCategory["id"];
	comment?: string;
}

export interface MyReportItemDTO {
	id: ContentReport["id"];
	recipeId: ContentReport["recipeId"] | null;
	category: Pick<ReportCategory, "id" | "code">;
	status: Pick<ReportStatus, "id" | "code">;
	comment: ContentReport["comment"] | null;
	createdAt: ISODateString;
}
export type MyReportsResponseDTO = PaginatedResponse<MyReportItemDTO>;

export type ReportCategoryDTO = Pick<ReportCategory, "id" | "code" | "name">;
export type ReportStatusDTO = Pick<ReportStatus, "id" | "code" | "name">;

// ===== Admin =====
export interface AdminReportListItemDTO extends MyReportItemDTO {
	processedAt?: ISODateString | null;
	processedBy?: UUID | null;
}
export type AdminReportListResponseDTO = PaginatedResponse<AdminReportListItemDTO>;

export interface UpdateAdminReportCommand {
	statusId: ReportStatus["id"];
	reason?: string;
}

export interface BlockRecipeCommand {
	isBlocked: Recipe["isBlocked"];
	reason?: string;
}

export interface UpdateRecipeVersionAdminCommand {
	prepTimeEstimate?: RecipeVersion["prepTimeEstimate"];
	dietIds?: Array<Diet["id"]>;
}

export interface CreateAttributionAdminCommand {
	sourceName: Attribution["sourceName"];
	sourceUrl?: Attribution["sourceUrl"] | null;
	imageSourceUrl?: Attribution["imageSourceUrl"] | null;
	license?: Attribution["license"] | null;
}

export interface StartImportBatchAdminCommand {
	// Placeholder for future fields; none required per API plan
}

export interface ImportBatchSummaryDTO {
	id: number;
	sourceName: string;
	status: string;
	startedAt: ISODateString;
	completedAt: ISODateString | null;
	insertedCount: number;
	updatedCount: number;
	skippedCount: number;
	errorCount: number;
}

export interface SourceRecordDTO {
	id: number;
	batchId: number;
	sourceName: string;
	externalId: string;
	recipeId: UUID | null;
	recipeVersionId: BigIntId | null;
	titleRaw: string | null;
	titleNormalized: string | null;
	operation: string;
	createdAt: ISODateString;
}

// ===== Events (Analytics) =====
export interface CaptureEventCommand {
	name:
		| "login_success"
		| "draw_click"
		| "reroll"
		| "filter_change"
		| "save_recipe"
		| "share_click"
		| "pwa_install"
		| "api_error";
	properties?: Record<string, unknown>;
	timestamp?: ISODateString;
}

// ===== Meta =====
export interface HealthDTO {
	status: "ok";
}

export interface ReadyDTO {
	status: "ready" | "degraded" | "down";
}

export interface VersionDTO {
	commit: string;
	version?: string;
}

// ===== Helpers to ensure linkage with DB model types =====
// If DB types change, these mapped fields will catch issues at compile time.
export type EnsureLink_ProfileId = ProfileDTO["userId"] extends Profile["userId"] ? true : never;
export type EnsureLink_RecipeId = RecipeDTO["id"] extends Recipe["id"] ? true : never;
export type EnsureLink_VersionId = RecipeVersionDTO["id"] extends RecipeVersion["id"] ? true : never;
