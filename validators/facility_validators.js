import Joi from 'joi';

export const addFacilityValidator = Joi.object({
    name:Joi.string().required(),
    description:Joi.string().required(),
    type:Joi.string().valid('hotel','conference room','party venue','hall').required(),
    location:Joi.string().required(),
    price:Joi.number().required(),
    availability:Joi.boolean().default(true),
    pictures:Joi.array().items(Joi.string()).default([]),
    managerId:Joi.string().required(),
    createdAt:Joi.date().default(Date.now),
    updatedAt:Joi.date().default(Date.now)
});