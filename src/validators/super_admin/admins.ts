import z from "zod";

export const createAdminSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name is required"),
    email: z.string({ required_error: "Email is required" }).email("Invalid email"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters long"),
  }),
});

export const updateAdminSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Admin ID is required" }).uuid("Invalid admin ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    email: z.string().email("Invalid email").optional(),
    password: z.string().min(6, "Password must be at least 6 characters long").optional(),
  }),
});

export const adminIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Admin ID is required" }).uuid("Invalid admin ID"),
  }),
});
