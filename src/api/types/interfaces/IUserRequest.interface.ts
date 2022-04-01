import { Request } from 'express';
import { OrderByDirection } from 'objection';

export interface IUserRequest extends Request {
  payload?: any;
  body: any;
  user: any;
  params: Record<string, string>;
}
