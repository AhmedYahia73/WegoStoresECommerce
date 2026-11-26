import z from "zod";

const emptyToUndefined = (val: unknown) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed === "" || trimmed.toLowerCase() === "null") return undefined;
    return trimmed;
  }
  return val;
};

export const getOrdersSummarySchema = z.object({
  query: z.object({
    user_id: z.preprocess(
      emptyToUndefined,
      z.string().uuid("Invalid user_id").optional()
    ),
    from: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .refine((val) => !Number.isNaN(new Date(val).getTime()), {
          message: "Invalid 'from' date",
        })
        .optional()
    ),
    to: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .refine((val) => !Number.isNaN(new Date(val).getTime()), {
          message: "Invalid 'to' date",
        })
        .optional()
    ),
    page: z.preprocess(emptyToUndefined, z.string().optional()),
    limit: z.preprocess(emptyToUndefined, z.string().optional()),
  }),
});
