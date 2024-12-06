import { z } from 'zod';

// https://github.com/colinhacks/zod/issues/1630
export const booleanParamSchema = z
  .enum(['true', 'false'])
  .transform(value => value === 'true');

export const numberSchema = z.preprocess(Number, z.number());
