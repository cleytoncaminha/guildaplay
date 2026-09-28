export type CatalogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type Publisher = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  countryCode: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Creator = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogTag = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type ReferenceRecord = Publisher | Creator | CatalogCategory | CatalogTag;

export type CatalogItemType = "CORE_BOOK" | "SETTING" | "ADVENTURE" | "SUPPLEMENT" | "TOOL";
export type CatalogExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CreatorRole = "AUTHOR" | "DESIGNER" | "ILLUSTRATOR" | "EDITOR" | "TRANSLATOR" | "OTHER";

export type CatalogItem = {
  id: string;
  type: CatalogItemType;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  originalReleaseYear: number | null;
  experienceLevel: CatalogExperienceLevel | null;
  status: CatalogStatus;
  systems: RpgSystem[];
  creators: Array<Creator & { role: CreatorRole }>;
  categories: CatalogCategory[];
  tags: CatalogTag[];
  aliases: Array<{ id: string; alias: string }>;
  sources: Array<{ id: string; label: string; url: string }>;
  relations: Array<{ id: string; type: string; item: { id: string; title: string; slug: string; status: CatalogStatus } }>;
  media: Array<{ id: string; assetId: string; kind: "COVER" | "IMAGE"; position: number; url: string }>;
  createdAt: string;
  updatedAt: string;
};

export type CatalogEdition = {
  id: string;
  catalogItemId: string;
  name: string;
  slug: string;
  languageCode: string;
  releaseYear: number | null;
  isbn10: string | null;
  isbn13: string | null;
  publisher: Publisher | null;
  createdAt: string;
  updatedAt: string;
};

export type RpgSystem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  releaseYear: number | null;
  status: CatalogStatus;
  publisher: Publisher | null;
  createdAt: string;
  updatedAt: string;
};

export type RpgSystemInput = {
  name: string;
  slug: string;
  description?: string | null;
  publisherId?: string | null;
  releaseYear?: number | null;
};

export type FeaturedListStatus = CatalogStatus;

export type FeaturedListItem = {
  position: number;
  item: Pick<CatalogItem, "id" | "title" | "slug" | "type">;
};

export type FeaturedList = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status?: FeaturedListStatus;
  items: FeaturedListItem[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SubmissionType = "CREATE_ITEM" | "UPDATE_ITEM";

export type AdminSubmission = {
  id: string;
  submittedByUserId: string;
  catalogItemId: string | null;
  type: SubmissionType;
  payload: Record<string, unknown>;
  status: SubmissionStatus;
  reviewReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportStatus = "PENDING" | "RESOLVED" | "DISMISSED";
export type ReportTargetType = "ITEM" | "MEDIA";
export type ReportReason = "DUPLICATE" | "INACCURATE" | "COPYRIGHT" | "INAPPROPRIATE" | "OTHER";

export type AdminReport = {
  id: string;
  reportedByUserId: string;
  targetType: ReportTargetType;
  catalogItemId: string | null;
  mediaAssetId: string | null;
  reason: ReportReason;
  duplicateOfCatalogItemId: string | null;
  description: string;
  status: ReportStatus;
  resolvedByUserId: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewStatus = "PENDING" | "PUBLISHED" | "REJECTED";

export type AdminReview = {
  id: string;
  rating: number;
  content: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
  catalogItem: { id: string; title: string; slug: string };
};

export type AuditLog = {
  id: string;
  eventType: string;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};
