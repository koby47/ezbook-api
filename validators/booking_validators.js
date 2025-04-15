import Joi from 'Joi';

export const bookingValidator = Joi.object({
    userId: Joi.string().required(),
    facilityId: Joi.string().required(),
    date: Joi.date().required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    package: Joi.string().required(),
    status: Joi.string().valid('approved', 'pending', 'cancelled').default('pending'),
    createdAt: Joi.date().default(Date.now),
    updatedAt: Joi.date().default(Date.now)
});