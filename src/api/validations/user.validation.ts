import * as Joi from 'joi';
import { boolean, string } from 'joi';

// PATCH api/v1/user/
// allowed inputs
const updateUser = {
  body: Joi.object({
    firstname: string(),
    lastname: string(),
    email: string(),
    lang: string(),
    format: boolean(),
    acdate: boolean(),
    newsletter: boolean(),
    todo: boolean(),
    sound: boolean(),
    tablexscroll: boolean(),
  })
};

export { updateUser };