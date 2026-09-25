import type { CatalogItem, CuratedItem, PaginationMeta } from "@/components/catalog-data";

export type PersonalCatalogItem = {
  catalogItem: Pick<CatalogItem, "id" | "title" | "slug" | "type">;
  hasItem: boolean;
  wantsItem: boolean;
  playedItem: boolean;
  isFavorite: boolean;
  privateComment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonalItemsResponse = { data: PersonalCatalogItem[]; meta: PaginationMeta };

export type PersonalCollection = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  items: CuratedItem[];
  createdAt: string;
  updatedAt: string;
};

export type PersonalCollectionsResponse = { data: PersonalCollection[] };

export type PersonalReview = {
  id: string;
  catalogItem: { id: string; title?: string; slug?: string };
  rating: number;
  content: string | null;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PersonalReviewsResponse = { data: PersonalReview[]; meta: PaginationMeta };
