import { z } from 'zod';

export const fieldSettingsSchema = z.record(z.string(), z.unknown());

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

export const patchBodySchema = z.object({ settings: settingsStringSchema });
export type PatchBody = z.infer<typeof patchBodySchema>;

export const fieldSettingResponseSchema = z.union([
  z.object({ settings: fieldSettingsSchema }),
  z.literal(false),
]);

export const fieldSettingPatchResponseSchema = fieldSettingsSchema;
