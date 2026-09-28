import { cache } from "react";
import { HttpClientError, requestJson } from "@/lib/http-client";
import type {
  CatalogItem,
  CatalogResponse,
  FeaturedList,
  FeaturedListsResponse,
  PublicCollection,
  ReviewsResponse,
} from "@/components/catalog-data";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:3000/api/v1").replace(/\/$/, "");

export class CatalogApiError extends HttpClientError {
  constructor(message: string, status: number, code?: string, requestId?: string) {
    super(message, status, code, requestId);
    this.name = "CatalogApiError";
  }
}

async function apiGet<T>(path: string): Promise<T> {
  try {
    return await requestJson<T>(`${API_BASE_URL}${path}`, { cache: "no-store" });
  } catch (error) {
    if (error instanceof HttpClientError) throw new CatalogApiError(error.message, error.status, error.code, error.requestId);
    throw error;
  }
}

export type CatalogListQuery = {
  q?: string;
  type?: CatalogItem["type"];
  languageCode?: string;
  year?: number;
  experienceLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  sort?: "TITLE" | "RELEASE_YEAR" | "NEWEST";
  order?: "ASC" | "DESC";
  page?: number;
  limit?: number;
};

export async function getCatalogItems(query: CatalogListQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return apiGet<CatalogResponse>(`/catalog/items?${params.toString()}`);
}

export const getCatalogItem = cache(async (slug: string) => {
  const response = await apiGet<{ data: CatalogItem }>(`/catalog/items/${encodeURIComponent(slug)}`);
  return response.data;
});

export const getCatalogReviews = cache((slug: string, page = 1, limit = 10) =>
  apiGet<ReviewsResponse>(
    `/catalog/items/${encodeURIComponent(slug)}/reviews?page=${page}&limit=${limit}`,
  ),
);

export const getFeaturedLists = cache((page = 1, limit = 12) =>
  apiGet<FeaturedListsResponse>(`/catalog/lists?page=${page}&limit=${limit}`),
);

export const getFeaturedList = cache(async (slug: string) => {
  const response = await apiGet<{ data: FeaturedList }>(`/catalog/lists/${encodeURIComponent(slug)}`);
  return response.data;
});

export const getPublicCollection = cache(async (collectionId: string) => {
  const response = await apiGet<{ data: PublicCollection }>(
    `/catalog/collections/${encodeURIComponent(collectionId)}`,
  );
  return response.data;
});
