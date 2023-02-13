import { Request } from 'express';

export interface User {
  bee_id: number;
  user_id: number;
  rank: 1 | 2 | 3 | 4;
  paid: boolean;
  user_agent: string;
  last_visit: Date;
}

export interface IUserRequest extends Request {
  payload?: any;
  body: any;
  user: User;
  params: Record<string, string>;
}

declare module 'express-session' {
  interface SessionData {
    user: {
      bee_id: number;
      user_id: number;
      rank: 1 | 2 | 3 | 4;
      paid: boolean;
      user_agent: string;
      last_visit: Date;
    };
  }
}
