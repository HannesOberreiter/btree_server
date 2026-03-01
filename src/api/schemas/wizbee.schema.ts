import { z } from 'zod';

export const wizBeeStreamBody = z.object({
  question: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'model', 'tool']),
    content: z.string(),
    toolName: z.string().optional(),
    toolDone: z.boolean().optional(),
    toolOutput: z.string().optional(),
    toolInput: z.string().optional(),
  })).optional(),
});
export type WizBeeStreamBody = z.infer<typeof wizBeeStreamBody>;
