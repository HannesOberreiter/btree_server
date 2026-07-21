import { z } from 'zod';

export const patchBodySchema = z.object({
  settings: z.custom<string>((data: any) => {
    try {
      JSON.parse(data);
    } catch {
      return false;
    }
    return true;
  }, 'invalid json'),
});
export type PatchBody = z.infer<typeof patchBodySchema>;
