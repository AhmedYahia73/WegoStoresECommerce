import z from "zod";

export const createUserSchema = z.object({
  body: z.object({
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
    subdomain: z.string().min(1, "Subdomain cannot be empty").optional(),
    phone: z.string().min(1, "Phone cannot be empty").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
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
