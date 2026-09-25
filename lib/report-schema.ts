import { z } from "zod";

const reasonSchema = z.enum(["DUPLICATE", "INACCURATE", "COPYRIGHT", "INAPPROPRIATE", "OTHER"]);
const descriptionSchema = z.string().trim().min(1, "Descreva o problema encontrado.").max(1000);

const itemReportSchema = z.object({
  targetType: z.literal("ITEM"),
  catalogItemId: z.uuid("Título inválido."),
  reason: reasonSchema,
  duplicateOfCatalogItemId: z.uuid("Selecione o outro título duplicado.").optional(),
  description: descriptionSchema,
}).strict().superRefine((value, context) => {
  if (value.reason === "DUPLICATE" && !value.duplicateOfCatalogItemId) {
    context.addIssue({ code: "custom", path: ["duplicateOfCatalogItemId"], message: "Selecione o outro título duplicado." });
  }
  if (value.reason !== "DUPLICATE" && value.duplicateOfCatalogItemId) {
    context.addIssue({ code: "custom", path: ["duplicateOfCatalogItemId"], message: "O título relacionado só pode ser informado para duplicidade." });
  }
  if (value.duplicateOfCatalogItemId === value.catalogItemId) {
    context.addIssue({ code: "custom", path: ["duplicateOfCatalogItemId"], message: "Um título não pode ser duplicado de si mesmo." });
  }
});

const mediaReportSchema = z.object({
  targetType: z.literal("MEDIA"),
  mediaAssetId: z.uuid("Selecione uma mídia válida."),
  reason: reasonSchema.exclude(["DUPLICATE"]),
  description: descriptionSchema,
}).strict();

export const reportSchema = z.union([itemReportSchema, mediaReportSchema]);

