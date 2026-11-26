import z from "zod";

export const createWalletOrderSchema = z.object({
  body: z.object({
    wallet: z
      .union([
        z.number().positive("Wallet amount must be greater than 0"),
        z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, "Invalid wallet amount")
          .refine((val) => Number(val) > 0, "Wallet amount must be greater than 0"),
      ], { required_error: "Wallet amount is required" }),
    user_id: z.string({ required_error: "User ID is required" }).uuid("Invalid user ID"),
    receipt: z.string().min(1, "Receipt cannot be empty").optional().nullable(),
  }),
});

export const changeWalletOrderStatusSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Wallet order ID is required" }).uuid("Invalid wallet order ID"),
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
        message: "reject_reason is required when rejecting a wallet order",
        path: ["reject_reason"],
      }
    ),
});

export const walletOrderIdParamSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Wallet order ID is required" }).uuid("Invalid wallet order ID"),
  }),
});
