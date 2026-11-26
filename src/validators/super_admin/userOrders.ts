import z from "zod";

export const createUserOrderSchema = z.object({
  body: z.object({
    package_id: z.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
    price: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)], {
      required_error: "Price is required",
    }),
    user_id: z.string({ required_error: "User ID is required" }).uuid("Invalid user ID"),
    receipt: z.string().min(1, "Receipt cannot be empty").optional().nullable(),
  }),
});

export const changeUserOrderStatusSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Order ID is required" }).uuid("Invalid order ID"),
  }),
  body: z
    .object({
      status: z.enum(["approve", "reject"], {
        required_error: "Status must be either 'approve' or 'reject'",
      }),
      reject_reason: z.string().optional().nullable(),
    })
    .refine(
      (data) => {
        if (data.status === "reject") {
          return !!data.reject_reason && data.reject_reason.trim().length > 0;
        }
        return true;
      },
      {
        message: "reject_reason is required when rejecting an order",
        path: ["reject_reason"],
      }
    ),
});

export const userOrderIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Order ID is required" }).uuid("Invalid order ID"),
  }),
});
