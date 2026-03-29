import { z } from "zod";

export const themePreferenceSchema = z.enum(["light", "dark", "system"]);
export const densityPreferenceSchema = z.enum(["comfortable", "compact"]);

export const userSettingsPatchSchema = z
  .object({
    theme: themePreferenceSchema.optional(),
    density: densityPreferenceSchema.optional(),
  })
  .refine((v) => v.theme !== undefined || v.density !== undefined, {
    message: "At least one field is required.",
  });

export type UserSettingsPatchInput = z.infer<typeof userSettingsPatchSchema>;
