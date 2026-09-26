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
