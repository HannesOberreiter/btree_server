import { z } from 'zod';

export const fieldSettingsSchema = z.record(z.string(), z.unknown());

// Deprecated: cached PWA clients send settings as a JSON string. Remove after the transition period.
const settingsStringSchema = z.string().transform((value, context) => {
  try {
    const result = fieldSettingsSchema.safeParse(JSON.parse(value));
    if (result.success) return result.data;
  } catch {
    // Report one stable validation issue below.
  }

  context.addIssue({ code: 'custom', message: 'invalid json object' });
  return z.NEVER;
});

export const patchBodySchema = z.object({
  settings: z.union([fieldSettingsSchema, settingsStringSchema]),
});
export type PatchBody = z.infer<typeof patchBodySchema>;

export const fieldSettingResponseSchema = z.union([
  z.object({ settings: fieldSettingsSchema }),
  z.literal(false),
]);

export const fieldSettingPatchResponseSchema = fieldSettingsSchema;
