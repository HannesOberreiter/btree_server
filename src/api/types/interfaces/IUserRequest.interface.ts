import { Request } from 'express';

export interface User {
  exp: number;
  iat: number;
  sub: number;
  bee_id: number;
  user_id: number;
  rank: 1 | 2 | 3;
  paid: boolean;
}

export interface IUserRequest extends Request {
  payload?: any;
  body: any;
  user: User;
  params: Record<string, string>;
}
