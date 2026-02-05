import { z } from 'zod';

export const beeSchema = z.object({
  id: z.number(),
  email: z.string().nullable(),
  username: z.string().nullable(),
}).nullable();

export type Bee = z.infer<typeof beeSchema>;

export const todoResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  date: z.string(), // Date as ISO string
  note: z.string().nullable(),
  url: z.string().nullable(),
  done: z.boolean(),
  bee_id: z.number().nullable(),
  edit_id: z.number().nullable(),
  user_id: z.number().nullable(),
  created_at: z.string().nullable(), // Date as ISO string
  updated_at: z.string().nullable(), // Date as ISO string
  creator: beeSchema.optional(),
  editor: beeSchema.optional(),
});

export type TodoResponse = z.infer<typeof todoResponseSchema>;

export const todoPaginatedResponseSchema = z.object({
  results: z.array(todoResponseSchema),
  total: z.number(),
});

export type TodoPaginatedResponse = z.infer<typeof todoPaginatedResponseSchema>;

export const todoCreateSchema = z.object({
  name: z.string().min(1).max(48).trim(),
  date: z.string(),
  note: z.string().max(2000).optional(),
  url: z.string().max(512).optional(),
  done: z.boolean().optional(),
  interval: z.number().min(0).max(365).optional(),
  repeat: z.number().min(0).max(30).optional(),
});

export type TodoCreate = z.infer<typeof todoCreateSchema>;

export const todoUpdateSchema = z.object({
  name: z.string().min(1).max(48).trim().optional(),
  date: z.string().optional(),
  note: z.string().max(2000).optional(),
  url: z.string().max(512).optional(),
  done: z.boolean().optional(),
});

export type TodoUpdate = z.infer<typeof todoUpdateSchema>;

export const todoBatchUpdateSchema = z.object({
  ids: z.array(z.number()),
  data: todoUpdateSchema,
});

export type TodoBatchUpdate = z.infer<typeof todoBatchUpdateSchema>;

export const todoUpdateStatusSchema = z.object({
  ids: z.array(z.number()),
  status: z.boolean(),
});

export type TodoUpdateStatus = z.infer<typeof todoUpdateStatusSchema>;

export const todoUpdateDateSchema = z.object({
  ids: z.array(z.string()),
  start: z.string(),
});

export type TodoUpdateDate = z.infer<typeof todoUpdateDateSchema>;

export const todoBatchGetSchema = z.object({
  ids: z.array(z.number()),
});

export type TodoBatchGet = z.infer<typeof todoBatchGetSchema>;

export const todoBatchDeleteSchema = z.object({
  ids: z.array(z.number()),
});

export type TodoBatchDelete = z.infer<typeof todoBatchDeleteSchema>;
