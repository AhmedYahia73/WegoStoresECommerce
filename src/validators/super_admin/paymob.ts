import z from "zod";

const multilingualNameSchema = z.union([
  z.string().min(1, "Name is required").transform((val) => ({ ar: val, en: val })),
  z
    .record(z.string(), z.string())
    .refine(
      (obj) => Object.keys(obj).length > 0 && Object.values(obj).some((v) => v.trim().length > 0),
      { message: "At least one language is required for name" }
    ),
]);

export const createUpdatePaymobSchema = z.object({
  body: z.object({
    name: multilingualNameSchema,
    logo: z.string().min(1, "Logo image is required").optional(),
    api_key: z.string({ required_error: "API key is required" }).min(1, "API key is required"),
    iframe_id: z.union(
      [z.string().min(1, "iframe_id is required"), z.number().transform(String)],
      { required_error: "iframe_id is required" }
    ),
    integration_id: z.union(
      [z.string().min(1, "integration_id is required"), z.number().transform(String)],
      { required_error: "integration_id is required" }
    ),
    hmac: z.string({ required_error: "HMAC is required" }).min(1, "HMAC is required"),
    type: z.enum(["test", "live"], { required_error: "Type must be test or live" }).default("test"),
    status: z
      .preprocess((val) => (typeof val === "string" ? val === "true" || val === "1" : val), z.boolean())
      .default(true),
    callback_url: z.string().min(1).optional(),
  }),
});
