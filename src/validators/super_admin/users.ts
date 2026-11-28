import z from "zod";

export const subdomainSchema = z
  .string({ required_error: "Subdomain is required" })
  .trim()
  .min(1, "Subdomain is required")
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/,
    "Subdomain can only contain letters, numbers, hyphens, and underscores"
  )
  .refine(
    (val) => val.toLowerCase() !== "api-",
    "Subdomain name after 'api-' cannot be empty"
  );

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(1, "Name is required"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email"),
    subdomain: subdomainSchema,
    phone: z
      .string({ required_error: "Phone is required" })
      .min(1, "Phone is required"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters long"),
    package_id: z.string().uuid("Invalid package ID").optional().nullable(),
    wallet: z
      .union([
        z.number().nonnegative("wallet must be >= 0"),
        z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid wallet amount"),
      ])
      .optional()
      .default(0),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "User ID is required" })
      .uuid("Invalid user ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    email: z.string().email("Invalid email").optional(),
    subdomain: subdomainSchema.optional(),
    phone: z.string().min(1, "Phone cannot be empty").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .optional(),
    package_id: z.string().uuid("Invalid package ID").optional().nullable(),
    wallet: z
      .union([
        z.number().nonnegative("wallet must be >= 0"),
        z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid wallet amount"),
      ])
      .optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "User ID is required" })
      .uuid("Invalid user ID"),
  }),
});
