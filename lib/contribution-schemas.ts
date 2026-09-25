import { z } from "zod";

const itemTypeSchema = z.enum(["CORE_BOOK", "SETTING", "ADVENTURE", "SUPPLEMENT", "TOOL"]);
const experienceLevelSchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
const slugSchema = z.string().trim().min(1, "Informe o identificador do título.").max(280).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens no identificador.");

const optionalPayloadSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  slug: slugSchema.optional(),
  type: itemTypeSchema.optional(),
  experienceLevel: experienceLevelSchema.nullable().optional(),
  summary: z.string().trim().max(1000).nullable().optional(),
  description: z.string().trim().max(20000).nullable().optional(),
  originalReleaseYear: z.number().int().min(1900).max(2200).nullable().optional(),
}).strict();

const createPayloadSchema = optionalPayloadSchema.extend({
  title: z.string().trim().min(1, "Informe o título.").max(255),
  slug: slugSchema,
  type: itemTypeSchema,
});

const createContributionSchema = z.object({
  type: z.literal("CREATE_ITEM"),
  payload: createPayloadSchema,
}).strict();

const updateContributionSchema = z.object({
  type: z.literal("UPDATE_ITEM"),
  catalogItemId: z.uuid("Selecione um título válido."),
  payload: optionalPayloadSchema.refine((payload) => Object.keys(payload).length > 0, "Informe ao menos uma alteração."),
}).strict();

export const contributionSchema = z.discriminatedUnion("type", [createContributionSchema, updateContributionSchema]);

