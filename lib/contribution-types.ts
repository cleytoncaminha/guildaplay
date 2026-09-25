import type { CatalogItem, PaginationMeta } from "@/components/catalog-data";

export type ContributionType = "CREATE_ITEM" | "UPDATE_ITEM";
export type ContributionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ContributionPayload = Partial<{
  title: string;
  slug: string;
  type: CatalogItem["type"];
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null;
  summary: string | null;
  description: string | null;
  originalReleaseYear: number | null;
}>;

export type CatalogContribution = {
  id: string;
  type: ContributionType;
  catalogItemId: string | null;
  catalogItem: Pick<CatalogItem, "id" | "slug" | "title" | "type"> | null;
  payload: ContributionPayload;
  status: ContributionStatus;
  reviewReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContributionsResponse = {
  data: CatalogContribution[];
  meta: PaginationMeta;
};

