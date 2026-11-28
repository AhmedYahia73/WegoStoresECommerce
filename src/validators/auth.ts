import z from "zod";
import { subdomainSchema } from "./super_admin/users";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at leas 6 characters long"),
  }),
});

export const tenantSignupSchema = z.object({
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
  }),
});