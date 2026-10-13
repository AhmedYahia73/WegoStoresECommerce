import z from "zod";

const multilingualNameSchema = z
  .record(z.string(), z.string({ required_error: "Language translation must be a string" }))
  .refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  );

export const createPackageSchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    type: z.enum(["monthly", "quarterly", "biannual", "annual"], {
      required_error: "Package type is required (monthly, quarterly, biannual, annual)",
    }),
    price: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)], {
      required_error: "Price is required",
    }),
    status: z.boolean().optional().default(true),
  }),
});

export const updatePackageSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
  }),
  body: z.object({
    name: multilingualNameSchema.optional(),
    type: z.enum(["monthly", "quarterly", "biannual", "annual"]).optional(),
    price: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
    status: z.boolean().optional(),
  }),
});

export const packageIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
  }),
});
