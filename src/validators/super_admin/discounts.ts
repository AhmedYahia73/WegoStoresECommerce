import z from "zod";

const multilingualNameSchema = z
  .record(z.string(), z.string({ required_error: "Language translation must be a string" }))
  .refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  );

export const createDiscountSchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)], {
      required_error: "Amount is required",
    }),
    type: z.enum(["percentage", "value"], {
      required_error: "Type is required (percentage or value)",
    }),
    start_date: z
      .string({ required_error: "Start date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
    end_date: z
      .string({ required_error: "End date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  }),
});

export const updateDiscountSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Discount ID is required" }).uuid("Invalid discount ID"),
  }),
  body: z.object({
    name: multilingualNameSchema.optional(),
    amount: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
    type: z.enum(["percentage", "value"]).optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional(),
  }),
});

export const discountIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Discount ID is required" }).uuid("Invalid discount ID"),
  }),
});
