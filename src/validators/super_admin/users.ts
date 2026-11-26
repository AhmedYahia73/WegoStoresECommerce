import z from "zod";

const nullableOrdersLimitSchema = z
  .union([
    z.number().int("Must be an integer").min(0, "Must be >= 0"),
    z.string().regex(/^\d+$/, "Must be a non-negative integer").transform(Number),
  ])
  .nullable();

export const createUserSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: "Name is required" })
        .min(1, "Name is required"),
      email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email"),
      subdomain: z
        .string({ required_error: "Subdomain is required" })
        .min(1, "Subdomain is required"),
      phone: z
        .string({ required_error: "Phone is required" })
        .min(1, "Phone is required"),
      password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters long"),
      package_id: z.string().uuid("Invalid package ID").optional().nullable(),
      orders_from: z.coerce
        .number()
        .int("orders_from must be an integer")
        .min(0, "orders_from must be >= 0")
        .optional()
        .default(0),
      orders_to: nullableOrdersLimitSchema.optional().default(0),
      wallet: z
        .union([
          z.number().nonnegative("wallet must be >= 0"),
          z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid wallet amount"),
        ])
        .optional()
        .default(0),
    })
    .refine(
      (data) => data.orders_to === null || data.orders_to === undefined || data.orders_to >= data.orders_from,
      {
        message: "orders_to must be greater than or equal to orders_from",
        path: ["orders_to"],
      }
    ),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "User ID is required" })
      .uuid("Invalid user ID"),
  }),
  body: z
    .object({
      name: z.string().min(1, "Name cannot be empty").optional(),
      email: z.string().email("Invalid email").optional(),
      subdomain: z.string().min(1, "Subdomain cannot be empty").optional(),
      phone: z.string().min(1, "Phone cannot be empty").optional(),
      password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .optional(),
      package_id: z.string().uuid("Invalid package ID").optional().nullable(),
      orders_from: z.coerce
        .number()
        .int("orders_from must be an integer")
        .min(0, "orders_from must be >= 0")
        .optional(),
      orders_to: nullableOrdersLimitSchema.optional(),
      wallet: z
        .union([
          z.number().nonnegative("wallet must be >= 0"),
          z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid wallet amount"),
        ])
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

export const userIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "User ID is required" })
      .uuid("Invalid user ID"),
  }),
});
