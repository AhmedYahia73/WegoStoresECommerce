import z from "zod";

const multilingualNameSchema = z
  .record(z.string(), z.string({ required_error: "Language translation must be a string" }))
  .refine(
    (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
    { message: "At least one language is required for name" }
  );

const nullableOrdersLimitSchema = z
  .union([
    z.number().int("Must be an integer").min(0, "Must be >= 0"),
    z.string().regex(/^\d+$/, "Must be a non-negative integer").transform(Number),
  ])
  .nullable();

export const createPackageSchema = z.object({
  body: z
    .object({
      name: multilingualNameSchema,
      price: z.union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d{1,2})?$/)], {
        required_error: "Price is required",
      }),
      orders_from: z.coerce
        .number({ required_error: "orders_from is required" })
        .int("orders_from must be an integer")
        .min(0, "orders_from must be >= 0"),
      orders_to: nullableOrdersLimitSchema.optional().default(null),
      sort: z.coerce
        .number({ required_error: "sort is required" })
        .int("sort must be an integer")
        .min(0, "sort must be >= 0"),
    })
    .refine(
      (data) => data.orders_to === null || data.orders_to === undefined || data.orders_to >= data.orders_from,
      {
        message: "orders_to must be greater than or equal to orders_from",
        path: ["orders_to"],
      }
    ),
});

export const updatePackageSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
  }),
  body: z
    .object({
      name: multilingualNameSchema.optional(),
      price: z.union([z.number().nonnegative(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).optional(),
      orders_from: z.coerce
        .number()
        .int("orders_from must be an integer")
        .min(0, "orders_from must be >= 0")
        .optional(),
      orders_to: nullableOrdersLimitSchema.optional(),
      sort: z.coerce
        .number()
        .int("sort must be an integer")
        .min(0, "sort must be >= 0")
        .optional(),
    })
    .refine(
      (data) =>
        data.orders_from !== undefined && data.orders_to !== undefined && data.orders_to !== null
          ? data.orders_to >= data.orders_from
          : true,
      {
        message: "orders_to must be greater than or equal to orders_from",
        path: ["orders_to"],
      }
    ),
});

export const packageIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
  }),
});
