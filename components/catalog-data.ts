export type CatalogMedia = {
  id: string;
  kind: "COVER" | "IMAGE" | "GALLERY";
  position: number;
  url: string;
};

export type CatalogSystem = { id: string; name: string; slug: string };
export type CatalogCreator = CatalogSystem & { role: string };
export type CatalogCategory = CatalogSystem;
export type CatalogTag = CatalogSystem;

export type CatalogEdition = {
  id: string;
  name: string;
  slug: string;
  languageCode: string;
  releaseYear: number | null;
  publisher: CatalogSystem | null;
};

export type CatalogSource = { label: string; url: string };
export type CatalogRelation = { type: string; item: { title: string; slug: string } };

export type CatalogItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  type: "CORE_BOOK" | "SETTING" | "ADVENTURE" | "SUPPLEMENT" | "TOOL";
  originalReleaseYear: number | null;
  experienceLevel?: string | null;
  createdAt: string;
  updatedAt?: string;
  systems: CatalogSystem[];
  creators?: CatalogCreator[];
  categories?: CatalogCategory[];
  tags?: CatalogTag[];
  editions?: CatalogEdition[];
  sources?: CatalogSource[];
  relations?: CatalogRelation[];
  media: CatalogMedia[];
  reviews: { averageRating: number | null; reviewCount: number };
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CatalogResponse = { data: CatalogItem[]; meta: PaginationMeta };

export type CatalogReview = {
  id: string;
  rating: number;
  content: string | null;
  author: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

export type ReviewsResponse = {
  data: CatalogReview[];
  summary: { averageRating: number | null; reviewCount: number };
  meta: PaginationMeta;
};

export type CuratedItem = {
  position: number;
  item: Pick<CatalogItem, "id" | "title" | "slug" | "type">;
};

export type FeaturedList = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  curator: { id: string; name: string };
  items: CuratedItem[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeaturedListsResponse = { data: FeaturedList[]; meta: PaginationMeta };

export type PublicCollection = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  owner: { id: string; name: string };
  items: CuratedItem[];
  createdAt: string;
  updatedAt: string;
};

export const typeOptions = [
  { value: "CORE_BOOK", label: "Livro Básico" },
  { value: "ADVENTURE", label: "Aventura" },
  { value: "SUPPLEMENT", label: "Suplemento" },
  { value: "SETTING", label: "Cenário" },
  { value: "TOOL", label: "Ferramenta" },
] as const;

export const typeLabels: Record<CatalogItem["type"], string> = {
  CORE_BOOK: "Livro básico",
  SETTING: "Cenário",
  ADVENTURE: "Aventura",
  SUPPLEMENT: "Suplemento",
  TOOL: "Ferramenta",
};

export function coverUrl(item: CatalogItem) {
  return (item.media.find((media) => media.kind === "COVER") ?? item.media[0])?.url ?? null;
}
