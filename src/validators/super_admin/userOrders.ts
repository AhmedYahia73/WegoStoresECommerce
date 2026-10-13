import z from "zod";

export const createUserOrderSchema = z.object({
  body: z.object({
    package_id: z.string({ required_error: "Package ID is required" }).uuid("Invalid package ID"),
    discount_id: z.string().uuid("Invalid discount ID").optional().nullable(),
    price: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)], {
      required_error: "Price is required",
    }),
    discount: z
      .union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)])
      .optional()
      .default(0),
    final_price: z.union([z.number(), z.string().regex(/^\d+(\.\d{1,2})?$/)], {
      required_error: "Final price is required",
    }),
    user_id: z.string({ required_error: "User ID is required" }).uuid("Invalid user ID"),
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
