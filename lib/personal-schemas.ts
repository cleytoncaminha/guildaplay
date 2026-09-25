import { z } from "zod";

export const personalItemSchema = z.object({
  hasItem: z.boolean().optional(),
  wantsItem: z.boolean().optional(),
  playedItem: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  privateComment: z.string().max(5000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração.");

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da coleção.").max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  isPublic: z.boolean().optional().default(false),
});

export const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da coleção.").max(120).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  isPublic: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração.");

export const addCollectionItemSchema = z.object({ position: z.number().int().min(0).max(1_000_000).optional().default(0) });
export const reviewSchema = z.object({ rating: z.number().int().min(1).max(10), content: z.string().trim().max(5000).nullable().optional() });
