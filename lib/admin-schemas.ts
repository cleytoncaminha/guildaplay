import { z } from "zod";

const slug = z.string().trim().min(1, "Informe o slug.").max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens.");
const optionalText = (max: number) => z.union([z.string().trim().max(max), z.null()]).optional();
const optionalUuid = z.union([z.uuid(), z.null()]).optional();
const optionalYear = z.union([z.number().int().min(1900).max(2200), z.null()]).optional();
const name = (max: number) => z.string().trim().min(1, "Informe o nome.").max(max);
const websiteUrl = z.union([z.url("Informe uma URL completa."), z.literal(""), z.null()]).optional().transform((value) => value || null);

export const createRpgSystemSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(160),
  slug,
  description: optionalText(20000),
  publisherId: optionalUuid,
  releaseYear: optionalYear,
});

export const updateRpgSystemSchema = createRpgSystemSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Informe ao menos um campo para alterar.",
);

export const createPublisherSchema = z.object({
  name: name(160),
  slug,
  websiteUrl,
  countryCode: z.union([z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Use o código de país com duas letras."), z.literal(""), z.null()]).optional().transform((value) => value || null),
});

export const createCreatorSchema = z.object({ name: name(160), slug, websiteUrl });
export const createCategorySchema = z.object({ name: name(120), slug: slug.max(140), description: optionalText(5000) });
export const createTagSchema = z.object({ name: name(80), slug: slug.max(100) });

export const updatePublisherSchema = createPublisherSchema.partial();
export const updateCreatorSchema = createCreatorSchema.partial();
export const updateCategorySchema = createCategorySchema.partial();
export const updateTagSchema = createTagSchema.partial();

const itemType = z.enum(["CORE_BOOK", "SETTING", "ADVENTURE", "SUPPLEMENT", "TOOL"]);
const experienceLevel = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const creatorRole = z.enum(["AUTHOR", "DESIGNER", "ILLUSTRATOR", "EDITOR", "TRANSLATOR", "OTHER"]);

export const createCatalogItemSchema = z.object({
  type: itemType,
  title: z.string().trim().min(1, "Informe o título.").max(255),
  slug: z.string().trim().max(280).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido."),
  summary: optionalText(1000),
  description: optionalText(20000),
  originalReleaseYear: optionalYear,
  experienceLevel: z.union([experienceLevel, z.null()]).optional(),
  systemIds: z.array(z.uuid()).max(100).optional(),
  categoryIds: z.array(z.uuid()).max(100).optional(),
  tagIds: z.array(z.uuid()).max(100).optional(),
  creators: z.array(z.object({ creatorId: z.uuid(), role: creatorRole })).max(100).optional(),
});

export const updateCatalogItemSchema = createCatalogItemSchema.partial();

export const createEditionSchema = z.object({
  catalogItemId: z.uuid(),
  name: name(255),
  slug: z.string().trim().max(280).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido."),
  languageCode: z.string().trim().max(10).regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/, "Use um idioma como pt-BR."),
  publisherId: optionalUuid,
  releaseYear: optionalYear,
  isbn10: optionalText(20),
  isbn13: optionalText(20),
});
export const updateEditionSchema = createEditionSchema.partial();

export const createAliasSchema = z.object({ alias: z.string().trim().min(1).max(255) });
export const createSourceSchema = z.object({ label: z.string().trim().min(1).max(255), url: z.url().max(500) });
export const createRelationSchema = z.object({ targetItemId: z.uuid(), type: z.enum(["REQUIRES", "SUPPLEMENT_OF", "ADVENTURE_FOR", "SETTING_FOR", "EDITION_OF", "EXPANSION_OF", "COMPATIBLE_WITH"]) });
export const mediaUploadSchema = z.object({ purpose: z.enum(["CATALOG_COVER", "CATALOG_IMAGE"]), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), sizeBytes: z.number().int().min(1).max(10485760), catalogItemId: z.uuid() });
