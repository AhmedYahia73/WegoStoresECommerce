import z from "zod";

export const upsertSettingsSchema = z.object({
  body: z.object({
    perimission_days: z.preprocess(
      (val) => (typeof val === "string" && val.trim() !== "" ? Number(val) : val),
      z
        .number({
          required_error: "perimission_days is required",
          invalid_type_error: "perimission_days must be a number",
        })
        .int("perimission_days must be an integer")
        .min(0, "perimission_days must be 0 or greater")
    ),
  }),
});
