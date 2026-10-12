import z from "zod";

export const createPaymentMethodSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(1, "Name is required"),
    icon: z
      .string({ required_error: "Icon image is required" })
      .min(1, "Icon image is required"),
    description: z.string().optional().nullable(),
    status: z.boolean().optional(),
  }),
});

export const updatePaymentMethodSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "Payment method ID is required" })
      .uuid("Invalid payment method ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Name cannot be empty").optional(),
    icon: z.string().min(1, "Icon cannot be empty").optional(),
    description: z.string().optional().nullable(),
    status: z.boolean().optional(),
  }),
});

export const paymentMethodIdParamSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: "Payment method ID is required" })
      .uuid("Invalid payment method ID"),
  }),
});
