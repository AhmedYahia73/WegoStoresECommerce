import z from "zod";

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().min(1, "ID cannot be empty"), {
        required_error: "Array of IDs is required",
      })
      .min(1, "At least one ID must be provided"),
  }),
});
