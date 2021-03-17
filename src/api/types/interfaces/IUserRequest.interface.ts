import { Request } from 'express';

export interface IUserRequest extends Request {
    payload?: any;
    params: Record<string,string>;
}