import * as Joi from 'joi';

// PATCH api/v1/user/
// allowed inputs
const updateUser = {
  body: Joi.object({
    firstname: Joi.string(),
    lastname: Joi.string(),
    email: Joi.string(),
    lang: Joi.string(),
    format: Joi.boolean(),
    acdate: Joi.boolean(),
    newsletter: Joi.boolean(),
    todo: Joi.boolean(),
    sound: Joi.boolean(),
    tablexscroll: Joi.boolean()
  })
};

export { updateUser };
