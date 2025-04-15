import Joi from  'joi';

export const registerValidator = Joi.object({
    userName:Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'manager').default('user')
});

export const loginValidator = Joi.object({
    email: Joi.string().email().required(),
    password:Joi.string().min(6).required()
});