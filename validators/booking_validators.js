import Joi from 'joi';

export const bookingValidator = Joi.object({
    userId: Joi.string().required(),
    facilityId: Joi.string().required(),
    date: Joi.date().required(),
    startTime: Joi.string(),
    endTime: Joi.string(),
    package: Joi.string().allow,
    status: Joi.string().valid('approved', 'pending', 'cancelled').default('pending'),
    createdAt: Joi.date().default(Date.now),
    updatedAt: Joi.date().default(Date.now)
});