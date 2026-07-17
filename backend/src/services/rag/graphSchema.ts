import { z } from "zod";

export const entitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "le nom de l'entité ne peut pas être vide")
    .max(120, "le nom de l'entité est trop long (probablement une phrase, pas une entité)"),
  type: z
    .string()
    .trim()
    .min(1, "le type de l'entité ne peut pas être vide")
    .max(60, "le type de l'entité est trop long"),
});

const relationTypeSchema = z
  .string()
  .trim()
  .min(1, "le type de relation ne peut pas être vide")
  .max(60, "le type de relation est trop long")
  .transform((val) =>
    val
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "")
  )
  .refine((val) => val.length > 0, "le type de relation est vide après normalisation");

export const relationSchema = z.object({
  source: z.string().trim().min(1).max(120),
  relation: relationTypeSchema,
  target: z.string().trim().min(1).max(120),
});

// Schémas de tableau "bruts", réutilisables pour la validation élément par élément
// (le .element ne fonctionne que sur ZodArray, pas sur ZodDefault<ZodArray<...>>)
export const entitiesArraySchema = z.array(entitySchema);
export const relationsArraySchema = z.array(relationSchema);

export const extractionResultSchema = z.object({
  entities: entitiesArraySchema.default([]),
  relations: relationsArraySchema.default([]),
});

export type ValidatedEntity = z.infer<typeof entitySchema>;
export type ValidatedRelation = z.infer<typeof relationSchema>;
export type ValidatedExtractionResult = z.infer<typeof extractionResultSchema>;