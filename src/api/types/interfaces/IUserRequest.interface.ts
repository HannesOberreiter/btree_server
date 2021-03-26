import { Request } from 'express';

export interface IUserRequest extends Request {
    payload?: any;
    user?: any;
    params: Record<string,string>;
}